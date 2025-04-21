import { createGraphQLError } from 'graphql-yoga';
import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { Like } from 'typeorm';

import { Category, User } from '../../../database/entities';
import { getResources, returnError } from '../../../helpers/graphql';
import { PaginationInput, Resource, CreateCategoryInput, UpdateCategoryInput } from '../../../type';
import { NOT_FOUND } from '../../../helpers/error-constants';
import AppDataSource from '../../../database';
import { STATUS } from '../../../database/entities/Status';
import graphqlGuard from '../../middleware/graphql-guard';

const resolver = {
    Query: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getCategories: async (_: any, args: { input: PaginationInput; filter: { name: string; model: string; status: string; operation: 'AND' | 'OR' } }, context: any): Promise<Resource<Category>> => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let filters: any;

                const user = context.req?.session?.user as User;

                if (args.filter) {
                    filters =
                        args.filter.operation === 'AND'
                            ? {
                                  where: {
                                      ...(args.filter.name ? { name: Like(`%${args.filter.name}%`) } : {}),
                                      ...(args.filter.model ? { model: Like(`%${args.filter.model}%`) } : {}),
                                      ...(!user?.admin ? { status: 'public' } : args.filter.status ? { status: args.filter.status } : {}),
                                  },
                              }
                            : {
                                  where: [
                                      ...(args.filter.name
                                          ? [
                                                {
                                                    name: Like(`%${args.filter.name}%`),
                                                    ...(!user?.admin ? { status: 'public' } : args.filter.status ? { status: args.filter.status } : {}),
                                                },
                                            ]
                                          : []),
                                      ...(args.filter.model
                                          ? [
                                                {
                                                    model: Like(`%${args.filter.model}%`),
                                                    ...(!user?.admin ? { status: 'public' } : args.filter.status ? { status: args.filter.status } : {}),
                                                },
                                            ]
                                          : []),
                                  ],
                              };
                } else if (!user?.admin) {
                    filters = { where: { status: 'public' } };
                }

                const res = (await getResources(Category, args.input, [], filters)) as Resource<Category>;

                return res;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOneCategory: async (_: any, args: { input: { id: string } }): Promise<Category> => {
            try {
                const categoryRepository = AppDataSource.getRepository(Category);
                const category = await categoryRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                });

                if (category) {
                    return category;
                } else {
                    throw createGraphQLError('Category not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },
    Mutation: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createCategory: async (_: any, args: { input: CreateCategoryInput }): Promise<Category> => {
            try {
                const category = new Category();
                category.name = args.input.name;
                category.model = args.input.model;
                category.slug = args.input.slug;
                if (args.input.status) {
                    category.status = args.input.status;
                }
                const categoryRepository = AppDataSource.getRepository(Category);
                await categoryRepository.save(category);

                return category;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateCategory: async (_: any, args: { input: UpdateCategoryInput }): Promise<Category> => {
            try {
                const categoryRepository = AppDataSource.getRepository(Category);
                const category = await categoryRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                });

                if (category) {
                    if (args.input.name) category.name = args.input.name;
                    if (args.input.status) category.status = args.input.status;
                    if (args.input.slug) category.slug = args.input.slug;
                    if (args.input.model) category.model = args.input.model;
                    await categoryRepository.save(category);
                    return category;
                }

                throw createGraphQLError('Category not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deleteCategory: async (_: any, args: { input: { id: string } }): Promise<{ success: boolean }> => {
            try {
                const categoryRepository = AppDataSource.getRepository(Category);
                const result = await categoryRepository.delete(args.input.id);

                if (result.affected === 1) {
                    return { success: true };
                }

                throw createGraphQLError('Category not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        changeCategoryStatus: async (_: any, args: { input: { id: string; status: STATUS } }): Promise<Category> => {
            try {
                const categoryRepository = AppDataSource.getRepository(Category);
                const category = await categoryRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                });
                if (category) {
                    category.status = args.input.status;
                    await categoryRepository.save(category);
                    return category;
                } else throw createGraphQLError('Category not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
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
