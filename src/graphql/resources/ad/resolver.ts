import { createGraphQLError } from 'graphql-yoga';
import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { Like } from 'typeorm';

import { ACTIVE_STATUS, Ad } from '../../../database/entities';
import { PaginationInput, Resource, CreateAdInput, UpdateAdInput, DeleteAdInput, ChangeAdStatusInput } from '../../../type';
import { getResources, returnError } from '../../../helpers/graphql';
import AppDataSource from '../../../database';

import guard from '../../middleware/graphql-guard';

import { BAD_REQUEST, NOT_FOUND } from '../../../helpers/error-constants';

const relations = ['image'];

const resolver = {
    Query: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getAds: async (_: any, args: { input: PaginationInput; filter: { title: string; status: string } }): Promise<Resource<Ad>> => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let filters: any;

                if (args.filter) {
                    filters = args.filter.title ? { where: { title: Like(`%${args.filter.title}%`) } } : { where: {} };

                    if (args.filter.status) {
                        filters.where.status = args.filter.status;
                    }
                }

                const res = (await getResources(Ad, args.input, relations, filters)) as Resource<Ad>;

                return res;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOneAd: async (_: any, args: { input: { id: string; slug: string } }): Promise<Ad> => {
            try {
                const adRepository = AppDataSource.getRepository(Ad);

                if (!args.input.id && !args.input.slug) throw createGraphQLError('Input id or slug required', { extensions: { statusCode: 400, statusText: BAD_REQUEST } });

                const ad = await adRepository.findOne({
                    where: {
                        ...(args.input.id
                            ? {
                                  id: args.input.id,
                              }
                            : { slug: args.input.slug }),
                    },
                    relations,
                });

                if (ad) {
                    return ad;
                }

                throw createGraphQLError('Ad not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        getActiveAd: async (): Promise<Ad | null> => {
            try {
                const adRepository = AppDataSource.getRepository(Ad);

                const ad = await adRepository.findOne({
                    where: {
                        status: ACTIVE_STATUS.ENABLE,
                    },
                    relations,
                });

                return ad;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },

    Mutation: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createAd: async (_: any, args: { input: CreateAdInput }): Promise<Ad> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const newAd = Object.assign(new Ad(), args.input);

                await queryRunner.manager.save(newAd);

                await queryRunner.commitTransaction();

                return newAd;

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
        updateAd: async (_: any, args: { input: UpdateAdInput }): Promise<Ad> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const ad = await Ad.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations,
                });

                if (ad) {
                    const updatedAd = Object.assign(ad, args.input);
                    await queryRunner.manager.save(ad);

                    await queryRunner.commitTransaction();

                    return updatedAd;
                }

                throw createGraphQLError('Ad not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
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
        deleteAd: async (_: any, args: { input: DeleteAdInput }): Promise<{ success: boolean }> => {
            try {
                const adRepository = AppDataSource.getRepository(Ad);

                const ad = await adRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations,
                });

                if (ad) {
                    const result = await adRepository.delete(ad.id);
                    return { success: result.affected === 1 };
                }

                throw createGraphQLError('Ad not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        changeAdStatus: async (_: any, args: { input: ChangeAdStatusInput }): Promise<Ad> => {
            try {
                const adRepository = AppDataSource.getRepository(Ad);
                const ad = await adRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations,
                });

                if (ad) {
                    const { status } = args.input;
                    ad.status = status ?? ad.status;
                    await adRepository.save(ad);
                    return ad;
                }

                throw createGraphQLError('Ad not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },
};

const resolversComposition = {
    'Query.{getAds, getOneAd}': [guard(['admin'])],
    'Mutation.*': [guard(['admin'])],
};

export default composeResolvers(resolver, resolversComposition);
