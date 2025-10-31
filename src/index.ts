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

        // GraphQL routes
        app.use('/api', graphQLRouter);

        // Uploaded files
        app.use('/public', express.static(path.join(__dirname, '..', 'public')));

        // --- API scanmyprofilecvwithjob ---
        app.post('/api/scanmyprofilecvwithjob', async (req, res) => {
            const { pdfUrl, jobId } = req.body as { pdfUrl?: string; jobId?: string };
            if (!pdfUrl || !jobId) {
                return res.status(400).json({ message: 'pdfUrl and jobId are required' });
            }

            try {
                // Lazy imports to avoid ESM/CommonJS conflicts at build
                const axios = (await import('axios')).default;
                const pdfParse = (await import('pdf-parse')).default as unknown as (buffer: Buffer) => Promise<{ text: string }>;
                const { convert } = await import('html-to-text');
                const { Job } = await import('./database/entities/Job');
                const { default: AppDataSource } = await import('./database');

                // 1) Download PDF as Buffer
                const pdfResponse = await axios.get<ArrayBuffer>(pdfUrl, { responseType: 'arraybuffer', timeout: 20000 });
                const pdfBuffer = Buffer.from(pdfResponse.data);

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
                const jobHtml = job?.content || '';
                const jobText = jobHtml ? convert(jobHtml, { wordwrap: false, selectors: [{ selector: 'a', options: { ignoreHref: true } }] }) : '';

                return res.json({
                    message: `le pdf ${pdfUrl} et le job ${job?.title || jobId} sont recupéré par l'api`,
                    cvText,
                    jobText,
                });
            } catch (e) {
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
