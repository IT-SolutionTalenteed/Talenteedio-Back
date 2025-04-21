import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { Like } from 'typeorm';
import { createGraphQLError } from 'graphql-yoga';

import { getResources, returnError } from '../../../helpers/graphql';
import { PaginationInput, Resource, CreatePermissionInput, UpdatePermissionInput } from '../../../type';
import { NOT_FOUND } from '../../../helpers/error-constants';
import AppDataSource from '../../../database';
import graphqlGuard from '../../middleware/graphql-guard';
import { Permission } from '../../../database/entities';

const resolver = {
    Query: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getPermissions: async (_: any, args: { input: PaginationInput; filter: { title: string; status: string } }): Promise<Resource<Permission>> => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let filters: any;

                if (args.filter) {
                    filters = args.filter.title ? { where: { title: Like(`%${args.filter.title}%`) } } : { where: {} };
                }

                const res = (await getResources(Permission, args.input, [], filters)) as Resource<Permission>;

                return res;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOnePermission: async (_: any, args: { input: { id: string } }): Promise<Permission> => {
            try {
                const permissionRepository = AppDataSource.getRepository(Permission);
                const permission = await permissionRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                });

                if (permission) {
                    return permission;
                }

                throw createGraphQLError('Permission not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },

    Mutation: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createPermission: async (_: any, args: { input: CreatePermissionInput }): Promise<Permission> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const permission = Object.assign(new Permission(), args.input) as Permission;

                await queryRunner.manager.save(permission);

                await queryRunner.commitTransaction();

                return permission;
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
        updatePermission: async (_: any, args: { input: UpdatePermissionInput }): Promise<Permission> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const permission = await Permission.findOne({
                    where: {
                        id: args.input.id,
                    },
                });

                if (permission) {
                    const updatedPermission = Object.assign(permission, { ...args.input });
                    await queryRunner.manager.save(permission);

                    await queryRunner.commitTransaction();

                    return updatedPermission;
                }

                throw createGraphQLError('Permission not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

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
        deletePermission: async (_: any, args: { input: { id: string } }): Promise<{ success: boolean }> => {
            try {
                const permissionRepository = AppDataSource.getRepository(Permission);
                const result = await permissionRepository.delete(args.input.id);

                if (result.affected === 1) {
                    return { success: true };
                }

                throw createGraphQLError('Permission not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
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
