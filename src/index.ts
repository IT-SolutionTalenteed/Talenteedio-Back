/// <reference path="./type.d.ts" />
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { TypeormStore } from 'typeorm-store';

import AppDataSource from './database';
import { UserSession } from './database/entities';

import graphQLRouter from './graphql';
import authRouter from './auth';
import billingRouter from './billing';
import bookingValidationRouter from './routes/booking-validation.routes';
import walletRouter from './routes/wallet.routes';

import { initSentry } from './sentry';

import { CronJob } from 'cron';
import { checkJobExpiration } from './scripts/job/services';

dotenv.config();

const serve = async () => {
    try {
        // Initialize DB
        await AppDataSource.initialize();
        console.log('DB ready !');

        // Initialize Express app
        const app = express();

        const Sentry = initSentry(app);

        // The request handler must be the first middleware on the app
        app.use(Sentry.Handlers.requestHandler());

        // TracingHandler creates a trace for every incoming request
        app.use(Sentry.Handlers.tracingHandler());

        // Cors
        app.use(
            cors({
                origin: [
                    'http://localhost:4200',
                    'http://127.0.0.1:4200',
                    'http://localhost:5173',
                    'https://talenteed.rhosa.net',
                    'https://www.talenteed.rhosa.net', //
                    'https://talenteed.io',
                ],
                credentials: true,
            })
        );

        // Webhook Stripe (doit être AVANT express.json pour vérifier la signature)
        app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

        app.use(express.json({ limit: '100mb' }), express.urlencoded({ extended: true, limit: '100mb' }));

        // Session
        const repository = AppDataSource.getRepository(UserSession);

        const sessionMiddleware = session({
            secret: 'talenteed',
            resave: true,
            saveUninitialized: false,
            store: new TypeormStore({ repository }),
            cookie: {
                httpOnly: ['production', 'pre-production'].includes(process.env.NODE_ENV as string) ? true : false,
                secure: ['production', 'pre-production'].includes(process.env.NODE_ENV as string) ? true : false,
                ...(['production', 'pre-production'].includes(process.env.NODE_ENV as string) ? { domain: process.env.DOMAIN } : {}),
                // En développement, utiliser 'lax' pour permettre le partage entre localhost:4200 et localhost:5173
                ...(process.env.NODE_ENV === 'pre-production' ? { sameSite: 'none' } : { sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'strict' }),
            },
        });

        app.set('trust proxy', 1);

        app.use(sessionMiddleware);

        // Auth
        app.use('/api', authRouter);

        // Billing & Stripe
        app.use('/api', billingRouter);

        // Booking validation
        app.use('/api', bookingValidationRouter);

        // Wallet routes (monté sur /api/wallet pour éviter que le middleware auth intercepte les autres routes /api/*)
        app.use('/api/wallet', walletRouter);

        // GraphQL routes
        app.use('/api', graphQLRouter);

        // Uploaded files
        app.use('/public', express.static(path.join(__dirname, '..', 'public')));

        // --- API scanmyprofilecvwithjob ---
        app.post('/api/scanmyprofilecvwithjob', async (req, res) => {
            const { pdfUrl, jobId, cvId } = req.body as { pdfUrl?: string; jobId?: string; cvId?: string };
            if (!pdfUrl || !jobId) {
                return res.status(400).json({ message: 'pdfUrl and jobId are required' });
            }

            try {
                // Lazy imports to avoid ESM/CommonJS conflicts at build
                const axios = (await import('axios')).default;
                const pdfParse = (await import('pdf-parse')).default as unknown as (buffer: Buffer) => Promise<{ text: string }>;
                const { convert } = await import('html-to-text');
                const { Job } = await import('./database/entities/Job');
                const { ProfileMatchResult } = await import('./database/entities/ProfileMatchResult');
                const { default: AppDataSource } = await import('./database');

                // Check if we already have a cached result for this CV + Job combination
                if (cvId) {
                    const matchResultRepo = AppDataSource.getRepository(ProfileMatchResult);
                    const existingResult = await matchResultRepo.findOne({
                        where: { cvId, jobId },
                    });

                    if (existingResult) {
                        console.log('Returning cached profile match result');
                        return res.json({
                            message: `le pdf ${pdfUrl} et le job ${jobId} sont recupéré depuis le cache`,
                            cvText: existingResult.cvText,
                            jobText: existingResult.jobText,
                            pythonReturn: existingResult.pythonReturn,
                            cached: true,
                        });
                    }
                }

                // 1) Download PDF as Buffer
                let pdfBuffer: Buffer;
                try {
                    const pdfResponse = await axios.get<ArrayBuffer>(pdfUrl, { responseType: 'arraybuffer', timeout: 20000 });
                    pdfBuffer = Buffer.from(pdfResponse.data);
                } catch (err) {
                    console.error('PDF download failed:', err);
                    return res.status(400).json({ message: 'pdf_download_error' });
                }

                // 2) Extract text from PDF
                let cvText = '';
                try {
                    const parsed = await pdfParse(pdfBuffer);
                    cvText = (parsed?.text || '').trim();
                } catch {
                    cvText = '';
                }

                // 3) Load Job by id and extract text from HTML content
                const jobRepo = AppDataSource.getRepository(Job);
                const job = await jobRepo.findOne({ where: { id: jobId } });
                if (!job) {
                    return res.status(404).json({ message: 'job_not_found' });
                }
                const jobHtml = job?.content || '';
                const jobText = jobHtml ? convert(jobHtml, { wordwrap: false, selectors: [{ selector: 'a', options: { ignoreHref: true } }] }) : '';

                // 4) Call Python script to compute character counts
                let pythonReturn: unknown = null;
                try {
                    const { spawn } = await import('child_process');
                    const pythonPath = process.env.PYTHON_PATH || path.join(__dirname, '..', 'venv', 'bin', 'python3');
                    const scriptPath = path.join(__dirname, '..', 'ai-service', 'count_chars.py');

                    const child = spawn(pythonPath, [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });
                    child.stdin.write(JSON.stringify({ cvText, jobText }));
                    child.stdin.end();

                    const stdout = await new Promise<string>((resolve, reject) => {
                        let out = '';
                        let err = '';
                        child.stdout.on('data', (d) => (out += d.toString()));
                        child.stderr.on('data', (d) => (err += d.toString()));
                        child.on('error', reject);
                        child.on('close', (code) => {
                            if (code === 0) return resolve(out);
                            return reject(new Error(err || `Python exited with code ${code}`));
                        });
                    });

                    pythonReturn = JSON.parse(stdout);
                } catch (err) {
                    console.error('Python scoring failed:', err);
                    return res.status(500).json({ message: 'python_error' });
                }

                // 5) Store the result in database if cvId is provided
                if (cvId) {
                    try {
                        const matchResultRepo = AppDataSource.getRepository(ProfileMatchResult);
                        const matchResult = matchResultRepo.create({
                            cvId,
                            jobId,
                            cvText,
                            jobText,
                            pythonReturn,
                        });
                        await matchResultRepo.save(matchResult);
                        console.log('Profile match result saved to database');
                    } catch (err) {
                        console.error('Failed to save profile match result:', err);
                        // Continue even if saving fails
                    }
                }

                return res.json({
                    message: `le pdf ${pdfUrl} et le job ${job?.title || jobId} sont recupéré par l'api`,
                    cvText,
                    jobText,
                    pythonReturn,
                    cached: false,
                });
            } catch (e) {
                console.error('scanmyprofilecvwithjob failed:', e);
                return res.status(500).json({ message: 'internal_error' });
            }
        });
        // --- END API ---

        app.get('*', (req, res) => {
            res.redirect(process.env.FRONTEND_HOST as string);
        });

        // The error handler must be registered before any other error middleware and after all controllers
        app.use(Sentry.Handlers.errorHandler());

        app.listen(process.env.PORT);
        console.log(`App running in development on port ${process.env.PORT}`);
    } catch (error) {
        console.log(error);
    }
};

const job = CronJob.from({
    cronTime: '0 8 * * *',
    onTick: checkJobExpiration,
});

serve();
job.start();
// Force restart
