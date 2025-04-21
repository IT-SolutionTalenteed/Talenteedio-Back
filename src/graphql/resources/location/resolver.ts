import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { Like } from 'typeorm';
import { createGraphQLError } from 'graphql-yoga';

import { getResources, returnError } from '../../../helpers/graphql';
import { PaginationInput, Resource, CreateLocationInput, UpdateLocationInput } from '../../../type';
import { NOT_FOUND } from '../../../helpers/error-constants';
import AppDataSource from '../../../database';
import { STATUS } from '../../../database/entities/Status';
import graphqlGuard from '../../middleware/graphql-guard';
import { User, Address, Location } from '../../../database/entities';

const resolver = {
    Query: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getLocations: async (_: any, args: { input: PaginationInput; filter: { name: string; status: string } }, context: any): Promise<Resource<Location>> => {
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

                const res = (await getResources(Location, args.input, ['address'], filters)) as Resource<Location>;

                return res;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOneLocation: async (_: any, args: { input: { id: string } }): Promise<Location> => {
            try {
                const locationRepository = AppDataSource.getRepository(Location);
                const location = await locationRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: ['address'],
                });

                if (location) {
                    return location;
                }

                throw createGraphQLError('Location not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },

    Mutation: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createLocation: async (_: any, args: { input: CreateLocationInput }): Promise<Location> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const location = new Location();
                location.name = args.input.name;

                const address = Address.create(args.input.address);
                await queryRunner.manager.save(address);
                location.address = address;

                if (args.input.status) {
                    location.status = args.input.status;
                }

                await queryRunner.manager.save(location);

                await queryRunner.commitTransaction();

                return location;
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
        updateLocation: async (_: any, args: { input: UpdateLocationInput }): Promise<Location> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const location = await Location.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: ['address'],
                });

                if (location) {
                    if (args.input.address) {
                        await queryRunner.manager.update(Address, location.address.id, args.input.address);
                    }

                    const updatedLocation = Object.assign(location, { ...args.input, address: undefined });
                    await queryRunner.manager.save(location);

                    await queryRunner.commitTransaction();

                    return updatedLocation;
                }

                throw createGraphQLError('Location not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

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
        deleteLocation: async (_: any, args: { input: { id: string } }): Promise<{ success: boolean }> => {
            try {
                const locationRepository = AppDataSource.getRepository(Location);
                const result = await locationRepository.delete(args.input.id);

                if (result.affected === 1) {
                    return { success: true };
                }

                throw createGraphQLError('Location not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        changeLocationStatus: async (_: any, args: { input: { id: string; status: STATUS } }): Promise<Location> => {
            try {
                const location = await Location.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: ['address'],
                });

                if (location) {
                    location.status = args.input.status;
                    await location.save();
                    return location;
                }

                throw createGraphQLError('Location not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
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
