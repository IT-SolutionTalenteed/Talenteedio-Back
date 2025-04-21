import dotenv from 'dotenv';
import axios from 'axios';
import { createGraphQLError } from 'graphql-yoga';

import { BAD_REQUEST } from '../../helpers/error-constants';
import { returnError } from '../../helpers/graphql';

dotenv.config();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (next: any) => async (_: any, args: any, context: any, info: any) => {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    let captcha = '';

    if (context.request.headers.headersInit && context.request.headers.headersInit['x-captcha-response']) {
        captcha = context.request.headers.headersInit['x-captcha-response'];
    }

    if (!captcha) {
        throw createGraphQLError('CAPTCHA missing!', { extensions: { statusCode: 400, statusText: BAD_REQUEST } });
    }

    const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}`;

    try {
        const result = await axios.get(verificationURL);

        if (result?.data?.success) {
            return next(_, args, context, info);
        } else {
            throw createGraphQLError('CAPTCHA verification failed!', { extensions: { statusCode: 400, statusText: BAD_REQUEST } });
        }
    } catch (error) {
        throw returnError(error);
    }
};
