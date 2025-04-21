import { createGraphQLError } from 'graphql-yoga';
import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { Like } from 'typeorm';

import { JobType, User } from '../../../database/entities';
import { getResources, returnError } from '../../../helpers/graphql';
import { PaginationInput, Resource, CreateJobTypeInput, UpdateJobTypeInput } from '../../../type';
import { NOT_FOUND } from '../../../helpers/error-constants';
import AppDataSource from '../../../database';
import { STATUS } from '../../../database/entities/Status';
import graphqlGuard from '../../middleware/graphql-guard';

const resolver = {
    Query: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getJobTypes: async (_: any, args: { input: PaginationInput; filter: { name: string; status: string } }, context: any): Promise<Resource<JobType>> => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let filters: any;

                const user = context.req?.session?.user as User;

                if (args.filter) {
                    filters = args.filter.name ? { where: { name: Like(`%${args.filter.name}%`) } } : { where: {} };

                    if (!user?.admin) {
                        filters.where.status = 'public';
                    } else if (args.filter.status) {
                        filters.where.status = args.filter.status;
                    }
                } else if (!user?.admin) {
                    filters = { where: { status: 'public' } };
                }

                const res = (await getResources(JobType, args.input, [], filters)) as Resource<JobType>;

                return res;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOneJobType: async (_: any, args: { input: { id: string } }): Promise<JobType> => {
            try {
                const jobTypeRepository = AppDataSource.getRepository(JobType);
                const jobType = await jobTypeRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                });

                if (jobType) {
                    return jobType;
                } else {
                    throw createGraphQLError('JobType not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },
    Mutation: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createJobType: async (_: any, args: { input: CreateJobTypeInput }): Promise<JobType> => {
            try {
                const jobType = new JobType();
                jobType.name = args.input.name;
                if (args.input.status) {
                    jobType.status = args.input.status;
                }
                const jobTypeRepository = AppDataSource.getRepository(JobType);
                await jobTypeRepository.save(jobType);

                return jobType;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateJobType: async (_: any, args: { input: UpdateJobTypeInput }): Promise<JobType> => {
            try {
                const jobTypeRepository = AppDataSource.getRepository(JobType);
                const jobType = await jobTypeRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                });

                if (jobType) {
                    if (args.input.name) jobType.name = args.input.name;
                    if (args.input.status) jobType.status = args.input.status;
                    await jobTypeRepository.save(jobType);
                    return jobType;
                }

                throw createGraphQLError('JobType not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deleteJobType: async (_: any, args: { input: { id: string } }): Promise<{ success: boolean }> => {
            try {
                const jobTypeRepository = AppDataSource.getRepository(JobType);
                const result = await jobTypeRepository.delete(args.input.id);

                if (result.affected === 1) {
                    return { success: true };
                }

                throw createGraphQLError('JobType not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        changeJobTypeStatus: async (_: any, args: { input: { id: string; status: STATUS } }): Promise<JobType> => {
            try {
                const jobTypeRepository = AppDataSource.getRepository(JobType);
                const jobType = await jobTypeRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                });
                if (jobType) {
                    jobType.status = args.input.status;
                    await jobTypeRepository.save(jobType);
                    return jobType;
                } else throw createGraphQLError('JobType not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },
};

const resolversComposition = {
    'Mutation.*': [graphqlGuard(['admin'])],
};

export default composeResolvers(resolver, resolversComposition);
