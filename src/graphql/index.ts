import { Router } from 'express';
import { createYoga } from 'graphql-yoga';
import dotenv from 'dotenv';

import {
    mailerSchema,
    userSchema,
    articleSchema,
    mediaSchema,
    settingSchema,
    locationSchema,
    skillSchema,
    jobTypeSchema,
    categorySchema,
    jobSchema,
    jobFreelanceSchema,
    testimonialSchema,
    eventSchema,
    partnerSchema,
    interviewSchema, //
    valueSchema,
    permissionSchema,
    referredSchema,
    joinUsSchema,
    adSchema,
    pricingSchema,
    favoriteSchema,
    companyPlanSchema,
    companySchema,
    matchingProfileSchema,
} from './resources';

dotenv.config();

// Graphql router
const graphqlRouter = Router();

const graphiql = process.env.NODE_ENV !== 'production';

graphqlRouter.use('/mailer', createYoga({ schema: mailerSchema, graphqlEndpoint: '/api/mailer' }));
graphqlRouter.use('/user', createYoga({ schema: userSchema, graphqlEndpoint: '/api/user', graphiql }));
graphqlRouter.use('/article', createYoga({ schema: articleSchema, graphqlEndpoint: '/api/article', graphiql }));
graphqlRouter.use('/media', createYoga({ schema: mediaSchema, graphqlEndpoint: '/api/media', graphiql }));
graphqlRouter.use('/setting', createYoga({ schema: settingSchema, graphqlEndpoint: '/api/setting', graphiql }));
graphqlRouter.use('/skill', createYoga({ schema: skillSchema, graphqlEndpoint: '/api/skill', graphiql }));
graphqlRouter.use('/location', createYoga({ schema: locationSchema, graphqlEndpoint: '/api/location', graphiql }));
graphqlRouter.use('/job-type', createYoga({ schema: jobTypeSchema, graphqlEndpoint: '/api/job-type', graphiql }));
graphqlRouter.use('/category', createYoga({ schema: categorySchema, graphqlEndpoint: '/api/category', graphiql }));
graphqlRouter.use('/job', createYoga({ schema: jobSchema, graphqlEndpoint: '/api/job', graphiql }));
graphqlRouter.use('/jobfreelance', createYoga({ schema: jobFreelanceSchema, graphqlEndpoint: '/api/jobfreelance', graphiql }));
graphqlRouter.use('/testimonial', createYoga({ schema: testimonialSchema, graphqlEndpoint: '/api/testimonial', graphiql }));
graphqlRouter.use('/event', createYoga({ schema: eventSchema, graphqlEndpoint: '/api/event', graphiql }));
graphqlRouter.use('/partner', createYoga({ schema: partnerSchema, graphqlEndpoint: '/api/partner', graphiql }));
graphqlRouter.use('/interview', createYoga({ schema: interviewSchema, graphqlEndpoint: '/api/interview', graphiql }));
graphqlRouter.use('/value', createYoga({ schema: valueSchema, graphqlEndpoint: '/api/value', graphiql }));
graphqlRouter.use('/permission', createYoga({ schema: permissionSchema, graphqlEndpoint: '/api/permission', graphiql }));
graphqlRouter.use('/referred', createYoga({ schema: referredSchema, graphqlEndpoint: '/api/referred', graphiql }));
graphqlRouter.use('/join-us', createYoga({ schema: joinUsSchema, graphqlEndpoint: '/api/join-us' }));
graphqlRouter.use('/ad', createYoga({ schema: adSchema, graphqlEndpoint: '/api/ad' }));
graphqlRouter.use('/pricing', createYoga({ schema: pricingSchema, graphqlEndpoint: '/api/pricing', graphiql }));
graphqlRouter.use('/favorite', createYoga({ schema: favoriteSchema, graphqlEndpoint: '/api/favorite', graphiql }));
graphqlRouter.use('/company-plan', createYoga({ schema: companyPlanSchema, graphqlEndpoint: '/api/company-plan', graphiql }));
graphqlRouter.use('/company', createYoga({ schema: companySchema, graphqlEndpoint: '/api/company', graphiql }));
graphqlRouter.use('/matching-profile', createYoga({ schema: matchingProfileSchema, graphqlEndpoint: '/api/matching-profile', graphiql }));

// Catch-all route for /api - return helpful error message
graphqlRouter.all('/', (req, res) => {
    res.status(404).json({
        error: 'No GraphQL endpoint at /api root',
        message: 'Please use a specific endpoint like /api/user, /api/article, /api/event, etc.',
        availableEndpoints: [
            '/api/user',
            '/api/article',
            '/api/media',
            '/api/setting',
            '/api/skill',
            '/api/location',
            '/api/job-type',
            '/api/category',
            '/api/job',
            '/api/jobfreelance',
            '/api/testimonial',
            '/api/event',
            '/api/partner',
            '/api/interview',
            '/api/value',
            '/api/permission',
            '/api/referred',
            '/api/join-us',
            '/api/ad',
            '/api/pricing',
            '/api/favorite',
            '/api/company-plan',
            '/api/company',
            '/api/matching-profile',
            '/api/mailer'
        ]
    });
});

export default graphqlRouter;
