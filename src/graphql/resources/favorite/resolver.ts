import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { createGraphQLError } from 'graphql-yoga';
import graphqlGuard from '../../middleware/graphql-guard';
import { Favorite, FAVORITE_TYPE, User, Job } from '../../../database/entities';
import { PaginationInput } from '../../../type';
import { BAD_REQUEST, NOT_FOUND, UNAUTHORIZED } from '../../../helpers/error-constants';

const resolver = {
    Query: {
        getFavorites: async (
            _: any,
            args: { input: PaginationInput; type?: FAVORITE_TYPE },
            context: any
        ) => {
            try {
                const user = context.req?.session?.user as User;
                if (!user) {
                    throw createGraphQLError('Unauthorized', { extensions: { code: UNAUTHORIZED } });
                }

                const { page = 1, limit = 10 } = args.input || {};
                const skip = (page - 1) * limit;

                const queryBuilder = Favorite.createQueryBuilder('favorite')
                    .leftJoinAndSelect('favorite.user', 'user')
                    .leftJoinAndSelect('favorite.job', 'job')
                    .leftJoinAndSelect('job.company', 'jobCompany')
                    .leftJoinAndSelect('job.featuredImage', 'jobImage')
                    .leftJoinAndSelect('job.location', 'jobLocation')
                    .leftJoinAndSelect('job.category', 'jobCategory')
                    .leftJoinAndSelect('job.jobType', 'jobType')
                    .where('favorite.userId = :userId', { userId: user.id })
                    .orderBy('favorite.createdAt', 'DESC')
                    .skip(skip)
                    .take(limit);

                if (args.type) {
                    queryBuilder.andWhere('favorite.type = :type', { type: args.type });
                }

                const [data, total] = await queryBuilder.getManyAndCount();

                return {
                    data,
                    total,
                    page,
                    limit,
                };
            } catch (error: any) {
                throw createGraphQLError(error.message, { extensions: { code: error.extensions?.code || BAD_REQUEST } });
            }
        },

        getRecentFavorites: async (
            _: any,
            args: { limit?: number },
            context: any
        ) => {
            try {
                const user = context.req?.session?.user as User;
                if (!user) {
                    throw createGraphQLError('Unauthorized', { extensions: { code: UNAUTHORIZED } });
                }

                const limit = args.limit || 3;

                const favorites = await Favorite.createQueryBuilder('favorite')
                    .leftJoinAndSelect('favorite.job', 'job')
                    .leftJoinAndSelect('job.company', 'jobCompany')
                    .leftJoinAndSelect('job.featuredImage', 'jobImage')
                    .leftJoinAndSelect('job.location', 'jobLocation')
                    .leftJoinAndSelect('job.category', 'jobCategory')
                    .leftJoinAndSelect('job.jobType', 'jobType')
                    .where('favorite.userId = :userId', { userId: user.id })
                    .orderBy('favorite.createdAt', 'DESC')
                    .take(limit)
                    .getMany();

                return favorites;
            } catch (error: any) {
                throw createGraphQLError(error.message, { extensions: { code: error.extensions?.code || BAD_REQUEST } });
            }
        },

        isFavorite: async (
            _: any,
            args: { itemId: string; type: FAVORITE_TYPE },
            context: any
        ) => {
            try {
                const user = context.req?.session?.user as User;
                if (!user) {
                    return false;
                }

                const queryBuilder = Favorite.createQueryBuilder('favorite')
                    .where('favorite.userId = :userId', { userId: user.id })
                    .andWhere('favorite.type = :type', { type: args.type })
                    .andWhere('favorite.jobId = :itemId', { itemId: args.itemId });

                const favorite = await queryBuilder.getOne();
                return !!favorite;
            } catch (error: any) {
                return false;
            }
        },
    },

    Mutation: {
        addFavorite: async (
            _: any,
            args: { input: { itemId: string; type: FAVORITE_TYPE } },
            context: any
        ) => {
            try {
                const user = context.req?.session?.user as User;
                if (!user) {
                    throw createGraphQLError('Unauthorized', { extensions: { code: UNAUTHORIZED } });
                }

                const { itemId, type } = args.input;

                // Check if already exists
                const existingFavorite = await Favorite.createQueryBuilder('favorite')
                    .where('favorite.userId = :userId', { userId: user.id })
                    .andWhere('favorite.type = :type', { type })
                    .andWhere('favorite.jobId = :itemId', { itemId })
                    .getOne();

                if (existingFavorite) {
                    return {
                        success: true,
                        message: 'Already in favorites',
                        favorite: existingFavorite,
                    };
                }

                // Verify item exists
                if (type === FAVORITE_TYPE.JOB) {
                    const job = await Job.findOne({ where: { id: itemId } });
                    if (!job) {
                        throw createGraphQLError('Job not found', { extensions: { code: NOT_FOUND } });
                    }
                }

                const favorite = Favorite.create({
                    user,
                    type,
                    // Les deux types pointent vers la table job
                    job: { id: itemId },
                });

                await favorite.save();

                // Reload with relations
                const savedFavorite = await Favorite.findOne({
                    where: { id: favorite.id },
                    relations: ['user', 'job', 'job.company', 'job.featuredImage', 'job.location', 'job.category'],
                });

                return {
                    success: true,
                    message: 'Added to favorites',
                    favorite: savedFavorite,
                };
            } catch (error: any) {
                throw createGraphQLError(error.message, { extensions: { code: error.extensions?.code || BAD_REQUEST } });
            }
        },

        removeFavorite: async (
            _: any,
            args: { input: { itemId: string; type: FAVORITE_TYPE } },
            context: any
        ) => {
            try {
                const user = context.req?.session?.user as User;
                if (!user) {
                    throw createGraphQLError('Unauthorized', { extensions: { code: UNAUTHORIZED } });
                }

                const { itemId, type } = args.input;

                const favorite = await Favorite.createQueryBuilder('favorite')
                    .where('favorite.userId = :userId', { userId: user.id })
                    .andWhere('favorite.type = :type', { type })
                    .andWhere('favorite.jobId = :itemId', { itemId })
                    .getOne();

                if (!favorite) {
                    throw createGraphQLError('Favorite not found', { extensions: { code: NOT_FOUND } });
                }

                await favorite.remove();

                return {
                    success: true,
                    message: 'Removed from favorites',
                    favorite: null,
                };
            } catch (error: any) {
                throw createGraphQLError(error.message, { extensions: { code: error.extensions?.code || BAD_REQUEST } });
            }
        },

        toggleFavorite: async (
            _: any,
            args: { input: { itemId: string; type: FAVORITE_TYPE } },
            context: any
        ) => {
            try {
                const user = context.req?.session?.user as User;
                if (!user) {
                    throw createGraphQLError('Unauthorized', { extensions: { code: UNAUTHORIZED } });
                }

                const { itemId, type } = args.input;

                const existingFavorite = await Favorite.createQueryBuilder('favorite')
                    .where('favorite.userId = :userId', { userId: user.id })
                    .andWhere('favorite.type = :type', { type })
                    .andWhere('favorite.jobId = :itemId', { itemId })
                    .getOne();

                if (existingFavorite) {
                    // Remove
                    await existingFavorite.remove();
                    return {
                        success: true,
                        message: 'Removed from favorites',
                        favorite: null,
                    };
                } else {
                    // Add
                    // Verify item exists (les deux types sont des jobs)
                    const job = await Job.findOne({ where: { id: itemId } });
                    if (!job) {
                        throw createGraphQLError('Job not found', { extensions: { code: NOT_FOUND } });
                    }

                    const favorite = Favorite.create({
                        user,
                        type,
                        // Les deux types pointent vers la table job
                        job: { id: itemId },
                    });

                    await favorite.save();

                    // Reload with relations
                    const savedFavorite = await Favorite.findOne({
                        where: { id: favorite.id },
                        relations: ['user', 'job', 'job.company', 'job.featuredImage', 'job.location', 'job.category'],
                    });

                    return {
                        success: true,
                        message: 'Added to favorites',
                        favorite: savedFavorite,
                    };
                }
            } catch (error: any) {
                throw createGraphQLError(error.message, { extensions: { code: error.extensions?.code || BAD_REQUEST } });
            }
        },
    },
};

const resolversComposition = {
    'Query.getFavorites': [graphqlGuard()],
    'Query.getRecentFavorites': [graphqlGuard()],
    'Mutation.addFavorite': [graphqlGuard()],
    'Mutation.removeFavorite': [graphqlGuard()],
    'Mutation.toggleFavorite': [graphqlGuard()],
};

export default composeResolvers(resolver, resolversComposition);
