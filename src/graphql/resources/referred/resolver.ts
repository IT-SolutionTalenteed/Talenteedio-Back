import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { Like } from 'typeorm';
import { createGraphQLError } from 'graphql-yoga';

import { getResources, returnError } from '../../../helpers/graphql';
import { PaginationInput, Resource, CreateReferredInput } from '../../../type';
import { BAD_REQUEST, NOT_FOUND } from '../../../helpers/error-constants';
import AppDataSource from '../../../database';
import graphqlGuard from '../../middleware/graphql-guard';
import { User, Referred, Job } from '../../../database/entities';
import { validateEmail } from '../../../helpers/utils';
import transporter from '../../../helpers/mailer';
import path from 'path';

const relations = ['company.user', 'featuredImage', 'location.address', 'jobType', 'category', 'skills', 'values'];

const resolver = {
    Query: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getReferreds: async (_: any, args: { input: PaginationInput; filter: { talentEmail: string; talentFullName: string; talentNumber: string } }, context: any): Promise<Resource<Referred>> => {
            try {
                const user = context.req?.session?.user as User;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let filters: any = {};

                if (user.referral) {
                    filters = { where: { referral: { id: user.referral.id } } };
                }

                if (args.filter) {
                    if (!filters.where) {
                        filters = { where: {} };
                    }
                    if (args.filter.talentEmail) {
                        filters.where.talentEmail = Like(`%${args.filter.talentEmail}%`);
                    }
                    if (args.filter.talentFullName) {
                        filters.where.talentFullName = Like(`%${args.filter.talentFullName}%`);
                    }
                    if (args.filter.talentNumber) {
                        filters.where.talentNumber = Like(`%${args.filter.talentNumber}%`);
                    }
                }

                const res = (await getResources(Referred, args.input, ['job', 'referral.user'], filters)) as Resource<Referred>;

                return res;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOneReferred: async (_: any, args: { input: { id: string } }): Promise<Referred> => {
            try {
                const referredRepository = AppDataSource.getRepository(Referred);
                const referred = await referredRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: ['job', 'referral'],
                });

                if (referred) {
                    return referred;
                }

                throw createGraphQLError('Referred not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },

    Mutation: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createReferred: async (_: any, args: { input: CreateReferredInput }, context: any): Promise<Referred> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const user = context.req?.session?.user as User;

                const isValidEmail = validateEmail(args.input.talentEmail);

                if (!isValidEmail) {
                    throw createGraphQLError("Invalid format for talent's email", { extensions: { statusCode: 400, statusText: BAD_REQUEST } });
                }

                const job = await Job.findOne({
                    where: {
                        id: args.input.job.id,
                    },
                    relations: relations,
                });

                if (job) {
                    const referred = new Referred();

                    referred.job = job;
                    referred.referral = user.referral;
                    referred.talentEmail = args.input.talentEmail;
                    referred.talentFullName = args.input.talentFullName;
                    referred.talentNumber = args.input.talentNumber;
                    referred.jobReferenceLink = args.input.jobReferenceLink;

                    await queryRunner.manager.save(referred);

                    await queryRunner.commitTransaction();

                    await Promise.allSettled([
                        transporter.sendMail({
                            from: 'Talenteed.io ' + process.env.MAILUSER,
                            to: user.email,
                            subject: 'Reference for ' + job.title,
                            template: 'index',
                            context: {
                                title: `Hi ${user.name}`,
                                message: `You have successfully referred the job '${job.title}' to ${referred.talentEmail}.`,
                                host: process.env.FRONTEND_HOST,
                                imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                                imageTitle: 'Reference',
                                backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
                            },
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        } as any),

                        transporter.sendMail({
                            from: 'Talenteed.io ' + process.env.MAILUSER,
                            to: referred.talentEmail,
                            subject: 'Reference for ' + job.title,
                            template: 'index',
                            context: {
                                title: `Hi ${referred.talentFullName}`,
                                message: `You've been referred for a job. Click the link below to apply: ${new URL(referred.jobReferenceLink).toString()}`,
                                host: process.env.FRONTEND_HOST,
                                imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                                imageTitle: 'Reference',
                                backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
                            },
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        } as any),
                    ]);

                    return referred;
                }

                throw createGraphQLError('Job not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                await queryRunner.rollbackTransaction();
                throw returnError(error);
            } finally {
                // Release the query runner when done.
                await queryRunner.release();
            }
        },

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deleteReferred: async (_: any, args: { input: { id: string } }): Promise<{ success: boolean }> => {
            try {
                const referredRepository = AppDataSource.getRepository(Referred);
                const result = await referredRepository.delete(args.input.id);

                if (result.affected === 1) {
                    return { success: true };
                }

                throw createGraphQLError('Referred not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },
};

const resolversComposition = {
    'Query.*': [graphqlGuard(['admin', 'referral'])],
    'Mutation.*': [graphqlGuard(['referral'])],
};

export default composeResolvers(resolver, resolversComposition);
