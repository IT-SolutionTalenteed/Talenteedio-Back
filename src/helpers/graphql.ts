import { createGraphQLError } from 'graphql-yoga';
import { GraphQLError } from 'graphql';
import { QueryFailedError } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

import AppDataSource from '../database';
import { Class, FileUpload, PaginationInput, UploadedFile } from '../type';
import { BAD_REQUEST, INTERNAL_ERROR } from './error-constants';

import Sentry from '../sentry';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getResources = async (model: Class<any>, input: PaginationInput, relations?: string[], filters?: any) => {
    const repository = AppDataSource.getRepository(model);

    const total = await repository.count({ ...(filters ? filters : {}) });

    if (input) {
        const { limit, page, direction, orderBy } = input;

        if (limit && page && page > 0) {
            return {
                rows: await repository.find({
                    take: limit,
                    skip: (page - 1) * limit,
                    order: {
                        [orderBy]: direction,
                    },
                    ...(relations
                        ? {
                              relations: relations,
                          }
                        : {}),
                    ...(filters ? filters : {}),
                }),
                total,
                limit,
                page,
            };
        }

        return {
            rows: await repository.find({
                order: {
                    [orderBy]: direction,
                },
                ...(relations
                    ? {
                          relations: relations,
                      }
                    : {}),
                ...(filters ? filters : {}),
            }),
            total,
            limit,
            page,
        };
    }

    return {
        rows: await repository.find({
            ...(relations
                ? {
                      relations: relations,
                  }
                : {}),
            ...(filters ? filters : {}),
        }),
        total,
    };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const returnError = (error: any) => {
    if (error instanceof GraphQLError) {
        return error;
    } else if (error instanceof QueryFailedError) {
        console.log(error);
        return createGraphQLError(error.message, { extensions: { statusCode: 400, statusText: BAD_REQUEST } });
    } else {
        console.log(error);
        Sentry.captureException(error);
        return createGraphQLError('Internal server error', { extensions: { statusCode: 500, statusText: INTERNAL_ERROR } });
    }
};

export const processUpload = async (file: FileUpload, allowedType = 'image', maxSizeInBytes = 5 * 1024 * 1024 /* 10MB */): Promise<UploadedFile> => {
    const { blobParts, name, encoding, type, size } = file;

    if (!type.includes(allowedType)) {
        throw createGraphQLError(`Type of file not allowed, only ${allowedType} are allowed`, { extensions: { statusCode: 400, statusText: BAD_REQUEST } });
    }

    if (size > maxSizeInBytes) {
        throw createGraphQLError(`File size exceeds the allowed limit of ${maxSizeInBytes / (1024 * 1024)} MB`, { extensions: { statusCode: 400, statusText: BAD_REQUEST } });
    }

    const id = uuidv4();
    const directoryPath = path.join(__dirname, '..', '..', 'public', 'uploads');
    const filepath = path.join(directoryPath, `${id}-${name}`);
    const urlPath = `public/uploads/${id}-${name}`;
    const fileUrl = new URL(path.join(process.env.HOST as string, urlPath)).toString();
    // Save the file to disk
    const bufferData = Buffer.concat(blobParts);

    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath);
    }

    fs.writeFileSync(filepath, bufferData);

    return { id, filename: name, mimetype: type, encoding, fileUrl };
};
