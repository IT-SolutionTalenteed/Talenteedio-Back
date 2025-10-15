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
