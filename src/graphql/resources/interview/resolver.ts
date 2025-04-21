import { createGraphQLError } from 'graphql-yoga';
import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { Like } from 'typeorm';

import { Interview, User } from '../../../database/entities';
import { PaginationInput, Resource, CreateInterviewInput, UpdateInterviewInput, DeleteInterviewInput, ChangeInterviewStatusInput } from '../../../type';
import { getResources, returnError } from '../../../helpers/graphql';
import AppDataSource from '../../../database';

import guard from '../../middleware/graphql-guard';

import { BAD_REQUEST, NOT_FOUND } from '../../../helpers/error-constants';

const relations = ['admin.user'];

const resolver = {
    Query: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getInterviews: async (_: any, args: { input: PaginationInput; filter: { adminId: string; title: string; status: string } }, context: any): Promise<Resource<Interview>> => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let filters: any;

                const user = context.req?.session?.user as User;

                if (args.filter) {
                    filters = args.filter.title ? { where: { title: Like(`%${args.filter.title}%`) } } : { where: {} };

                    if (!user?.admin) {
                        filters.where.status = 'public';
                    } else if (args.filter.status) {
                        filters.where.status = args.filter.status;
                    }

                    if (args.filter.adminId) {
                        filters.where.admin = { id: args.filter.adminId };
                    }
                } else if (!user?.admin) {
                    filters = { where: { status: 'public' } };
                }

                const res = (await getResources(Interview, args.input, relations, filters)) as Resource<Interview>;

                return res;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOneInterview: async (_: any, args: { input: { id: string; slug: string } }): Promise<Interview> => {
            try {
                const interviewRepository = AppDataSource.getRepository(Interview);

                if (!args.input.id && !args.input.slug) throw createGraphQLError('Input id or slug required', { extensions: { statusCode: 400, statusText: BAD_REQUEST } });

                const interview = await interviewRepository.findOne({
                    where: {
                        ...(args.input.id
                            ? {
                                  id: args.input.id,
                              }
                            : { slug: args.input.slug }),
                    },
                    relations,
                });

                if (interview) {
                    return interview;
                }

                throw createGraphQLError('Interview not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },

    Mutation: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createInterview: async (_: any, args: { input: CreateInterviewInput }, context: any): Promise<Interview> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const newInterview = Object.assign(new Interview(), args.input);

                const user = context.req.session.user as User;

                newInterview.admin = user.admin;

                await queryRunner.manager.save(newInterview);

                await queryRunner.commitTransaction();

                return newInterview;

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
        updateInterview: async (_: any, args: { input: UpdateInterviewInput }): Promise<Interview> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const interview = await Interview.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations,
                });

                if (interview) {
                    const updatedInterview = Object.assign(interview, { ...args.input, categories: undefined });
                    await queryRunner.manager.save(interview);

                    await queryRunner.commitTransaction();

                    return updatedInterview;
                }

                throw createGraphQLError('Interview not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
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
        deleteInterview: async (_: any, args: { input: DeleteInterviewInput }): Promise<{ success: boolean }> => {
            try {
                const interviewRepository = AppDataSource.getRepository(Interview);

                const interview = await interviewRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations,
                });

                if (interview) {
                    const result = await interviewRepository.delete(interview.id);
                    return { success: result.affected === 1 };
                }

                throw createGraphQLError('Interview not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        changeInterviewStatus: async (_: any, args: { input: ChangeInterviewStatusInput }): Promise<Interview> => {
            try {
                const interviewRepository = AppDataSource.getRepository(Interview);
                const interview = await interviewRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations,
                });

                if (interview) {
                    const { status } = args.input;
                    interview.status = status ?? interview.status;
                    await interviewRepository.save(interview);
                    return interview;
                }

                throw createGraphQLError('Interview not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },
};

const resolversComposition = {
    'Mutation.*': [guard(['admin'])],
};

export default composeResolvers(resolver, resolversComposition);
