import { createGraphQLError } from 'graphql-yoga';
import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { Like } from 'typeorm';

import { getResources, returnError } from '../../../helpers/graphql';
import { PaginationInput, Resource, CreateValueInput, UpdateValueInput } from '../../../type';
import { NOT_FOUND } from '../../../helpers/error-constants';
import AppDataSource from '../../../database';
import { STATUS } from '../../../database/entities/Status';
import graphqlGuard from '../../middleware/graphql-guard';
import { User, Value } from '../../../database/entities';

const resolver = {
    Query: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getValues: async (_: any, args: { input: PaginationInput; filter: { name: string; status: string } }, context: any): Promise<Resource<Value>> => {
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

                const res = (await getResources(Value, args.input, [], filters)) as Resource<Value>;

                return res;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOneValue: async (_: any, args: { input: { id: string } }): Promise<Value> => {
            try {
                const valueRepository = AppDataSource.getRepository(Value);
                const value = await valueRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                });

                if (value) {
                    return value;
                } else {
                    throw createGraphQLError('Value not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },
    Mutation: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createValue: async (_: any, args: { input: CreateValueInput }): Promise<Value> => {
            try {
                const value = new Value();
                value.title = args.input.title;
                if (args.input.status) {
                    value.status = args.input.status;
                }
                const valueRepository = AppDataSource.getRepository(Value);
                await valueRepository.save(value);

                return value;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateValue: async (_: any, args: { input: UpdateValueInput }): Promise<Value> => {
            try {
                const valueRepository = AppDataSource.getRepository(Value);
                const value = await valueRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                });
                if (value) {
                    if (args.input.title) value.title = args.input.title;
                    if (args.input.status) value.status = args.input.status;
                    await valueRepository.save(value);
                    return value;
                } else throw createGraphQLError('Value not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deleteValue: async (_: any, args: { input: { id: string } }): Promise<{ success: boolean }> => {
            try {
                const valueRepository = AppDataSource.getRepository(Value);
                const result = await valueRepository.delete(args.input.id);

                if (result.affected === 1) {
                    return { success: true };
                }

                throw createGraphQLError('Value not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        changeValueStatus: async (_: any, args: { input: { id: string; status: STATUS } }): Promise<Value> => {
            try {
                const valueRepository = AppDataSource.getRepository(Value);

                const value = await valueRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                });
                if (value) {
                    value.status = args.input.status;
                    await valueRepository.save(value);
                    return value;
                } else throw createGraphQLError('Value not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
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
