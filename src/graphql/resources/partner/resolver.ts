import { createGraphQLError } from 'graphql-yoga';
import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { Like } from 'typeorm';

import { Partner, User } from '../../../database/entities';
import { PaginationInput, Resource, CreatePartnerInput, UpdatePartnerInput, DeletePartnerInput, ChangePartnerStatusInput } from '../../../type';
import { getResources, returnError } from '../../../helpers/graphql';
import AppDataSource from '../../../database';

import guard from '../../middleware/graphql-guard';

import { BAD_REQUEST, NOT_FOUND } from '../../../helpers/error-constants';

const relations = ['image'];

const resolver = {
    Query: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getPartners: async (_: any, args: { input: PaginationInput; filter: { title: string; status: string } }, context: any): Promise<Resource<Partner>> => {
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
                } else if (!user?.admin) {
                    filters = { where: { status: 'public' } };
                }

                const res = (await getResources(Partner, args.input, relations, filters)) as Resource<Partner>;

                return res;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOnePartner: async (_: any, args: { input: { id: string; slug: string } }): Promise<Partner> => {
            try {
                const partnerRepository = AppDataSource.getRepository(Partner);

                if (!args.input.id && !args.input.slug) throw createGraphQLError('Input id or slug required', { extensions: { statusCode: 400, statusText: BAD_REQUEST } });

                const partner = await partnerRepository.findOne({
                    where: {
                        ...(args.input.id
                            ? {
                                  id: args.input.id,
                              }
                            : { slug: args.input.slug }),
                    },
                    relations,
                });

                if (partner) {
                    return partner;
                }

                throw createGraphQLError('Partner not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },

    Mutation: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createPartner: async (_: any, args: { input: CreatePartnerInput }): Promise<Partner> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const newPartner = Object.assign(new Partner(), args.input);

                await queryRunner.manager.save(newPartner);

                await queryRunner.commitTransaction();

                return newPartner;

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
        updatePartner: async (_: any, args: { input: UpdatePartnerInput }): Promise<Partner> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const partner = await Partner.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations,
                });

                if (partner) {
                    const updatedPartner = Object.assign(partner, args.input);
                    await queryRunner.manager.save(partner);

                    await queryRunner.commitTransaction();

                    return updatedPartner;
                }

                throw createGraphQLError('Partner not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
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
        deletePartner: async (_: any, args: { input: DeletePartnerInput }): Promise<{ success: boolean }> => {
            try {
                const partnerRepository = AppDataSource.getRepository(Partner);

                const partner = await partnerRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations,
                });

                if (partner) {
                    const result = await partnerRepository.delete(partner.id);
                    return { success: result.affected === 1 };
                }

                throw createGraphQLError('Partner not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        changePartnerStatus: async (_: any, args: { input: ChangePartnerStatusInput }): Promise<Partner> => {
            try {
                const partnerRepository = AppDataSource.getRepository(Partner);
                const partner = await partnerRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations,
                });

                if (partner) {
                    const { status } = args.input;
                    partner.status = status ?? partner.status;
                    await partnerRepository.save(partner);
                    return partner;
                }

                throw createGraphQLError('Partner not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

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
