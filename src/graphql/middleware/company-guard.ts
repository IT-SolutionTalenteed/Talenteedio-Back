import { createGraphQLError } from 'graphql-yoga';
import { Between } from 'typeorm';

import { Article, Job, User } from '../../database/entities';

import { PAYMENT_REQUIRED, INTERNAL_ERROR } from '../../helpers/error-constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (resource: 'article' | 'job') => (next: any) => async (_: any, args: any, context: any, info: any) => {
    const user = context.req.session.user as User;

    if (user.company) {
        const currentTime = new Date();
        const startDate = new Date(`${currentTime.getFullYear()}-01-01`);
        const endDate = new Date(`${currentTime.getFullYear()}-12-31`);

        if (resource === 'article') {
            if (user.company.permission.numberOfArticlesPerYear >= 0) {
                const results = await Article.count({
                    where: {
                        createdAt: Between(startDate, endDate),
                        company: { id: user.company.id },
                    },
                });

                if (results >= user.company.permission.numberOfArticlesPerYear) {
                    throw createGraphQLError(`Article quota reached for this year`, { extensions: { statusCode: 422, statusText: PAYMENT_REQUIRED } });
                }
            }
        } else if (resource === 'job') {
            if (user.company.permission.validityPeriodOfAJob >= 0) {
                currentTime.setDate(currentTime.getDate() + user.company.permission.validityPeriodOfAJob);
                args.input.expirationDate = currentTime;
            }

            if (user.company.permission.numberOfJobsPerYear >= 0) {
                const results = await Job.count({
                    where: {
                        createdAt: Between(startDate, endDate),
                        company: { id: user.company.id },
                    },
                });

                if (results >= user.company.permission.numberOfJobsPerYear) {
                    throw createGraphQLError(`Job quota reached for this year`, { extensions: { statusCode: 422, statusText: PAYMENT_REQUIRED } });
                }
            }
        } else {
            throw createGraphQLError(`Internal server error`, { extensions: { statusCode: 500, statusText: INTERNAL_ERROR } });
        }
    }

    return next(_, args, context, info);
};
