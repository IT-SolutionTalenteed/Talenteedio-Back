import jwt from 'jsonwebtoken';

import { RoleName } from '../../type';
import { User } from '../../database/entities';
import { createGraphQLError } from 'graphql-yoga';

import { FORBIDDEN, UNAUTHORIZED } from '../../helpers/error-constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (roles?: RoleName[]) => (next: any) => (_: any, args: any, context: any, info: any) => {
    let token = '';

    if (context.request.headers && context.request.headers.authorization) {
        token = context.request.headers.authorization.split(' ')[1];
    } else if (context.request.headers && context.request.headers.get && context.request.headers.get('authorization')) {
        token = context.request.headers.get('authorization').split(' ')[1];
    }

    if (!token) {
        throw createGraphQLError('Access denied: token missing!', { extensions: { statusCode: 401, statusText: UNAUTHORIZED } });
    }

    return jwt.verify(token, process.env.SECRET_ACCESS_TOKEN as string, async (err) => {
        if (err) {
            if ((err as jwt.VerifyErrors).name === 'TokenExpiredError') {
                throw createGraphQLError('Access denied: token expired!', { extensions: { statusCode: 401, statusText: UNAUTHORIZED, code: 'TOKEN_EXPIRED' } });
            }
            throw createGraphQLError('Access denied: token invalid!', { extensions: { statusCode: 401, statusText: UNAUTHORIZED } });
        }

        if (context.req.session.accessToken && context.req.session.accessToken === token) {
            const user = (await User.findOne({ where: { id: context.req.session.user?.id }, relations: ['admin', 'company.permission', 'referral', 'talent', 'hrFirstClub', 'consultant'] })) as User;

            if (!user) {
                throw createGraphQLError('Access denied: user not found!', { extensions: { statusCode: 401, statusText: UNAUTHORIZED } });
            }

            context.req.session.user = user;

            if (roles) {
                if (user.roles.some((role) => roles.includes(role.name))) {
                    return next(_, args, context, info);
                } else {
                    throw createGraphQLError('Access denied: resource forbidden!', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                }
            }

            return next(_, args, context, info);
        }

        throw createGraphQLError('Access denied: session invalid!', { extensions: { statusCode: 401, statusText: UNAUTHORIZED } });
    });
};
