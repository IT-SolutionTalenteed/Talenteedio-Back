import { type Express } from 'express';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import dotenv from 'dotenv';

dotenv.config();

export const initSentry = (app: Express) => {
    Sentry.init({
        dsn: process.env.SENTRY_URL,
        integrations: [
            // enable HTTP calls tracing
            new Sentry.Integrations.Http({ tracing: true }),
            // enable Express.js middleware tracing
            new Sentry.Integrations.Express({ app }),
            new ProfilingIntegration(),
        ],
        // Performance Monitoring
        tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
        // Set sampling rate for profiling - this is relative to tracesSampleRate
        profilesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
    });

    return Sentry;
};

export default Sentry;
