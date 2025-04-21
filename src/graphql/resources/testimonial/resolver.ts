import { createGraphQLError } from 'graphql-yoga';
import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { Like } from 'typeorm';

import { getResources, returnError } from '../../../helpers/graphql';
import { PaginationInput, Resource, CreateTestimonialInput, UpdateTestimonialInput } from '../../../type';
import { NOT_FOUND } from '../../../helpers/error-constants';
import AppDataSource from '../../../database';
import { STATUS } from '../../../database/entities/Status';
import graphqlGuard from '../../middleware/graphql-guard';
import { User, Testimonial } from '../../../database/entities';

const resolver = {
    Query: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getTestimonials: async (_: any, args: { input: PaginationInput; filter: { name: string; status: string } }, context: any): Promise<Resource<Testimonial>> => {
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

                const res = (await getResources(Testimonial, args.input, [], filters)) as Resource<Testimonial>;

                return res;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOneTestimonial: async (_: any, args: { input: { id: string } }): Promise<Testimonial> => {
            try {
                const testimonialRepository = AppDataSource.getRepository(Testimonial);
                const testimonial = await testimonialRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                });

                if (testimonial) {
                    return testimonial;
                } else {
                    throw createGraphQLError('Testimonial not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },
    Mutation: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createTestimonial: async (_: any, args: { input: CreateTestimonialInput }): Promise<Testimonial> => {
            try {
                const testimonial = new Testimonial();
                testimonial.name = args.input.name;
                testimonial.comment = args.input.comment;
                testimonial.jobPosition = args.input.jobPosition;
                if (args.input.status) {
                    testimonial.status = args.input.status;
                }
                const testimonialRepository = AppDataSource.getRepository(Testimonial);
                await testimonialRepository.save(testimonial);

                return testimonial;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateTestimonial: async (_: any, args: { input: UpdateTestimonialInput }): Promise<Testimonial> => {
            try {
                const testimonialRepository = AppDataSource.getRepository(Testimonial);
                const testimonial = await testimonialRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                });
                if (testimonial) {
                    if (args.input.name) testimonial.name = args.input.name;
                    if (args.input.comment) testimonial.comment = args.input.comment;
                    if (args.input.jobPosition) testimonial.jobPosition = args.input.jobPosition;
                    if (args.input.status) testimonial.status = args.input.status;
                    await testimonialRepository.save(testimonial);
                    return testimonial;
                } else throw createGraphQLError('Testimonial not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deleteTestimonial: async (_: any, args: { input: { id: string } }): Promise<{ success: boolean }> => {
            try {
                const testimonialRepository = AppDataSource.getRepository(Testimonial);
                const result = await testimonialRepository.delete(args.input.id);

                if (result.affected === 1) {
                    return { success: true };
                }

                throw createGraphQLError('Testimonial not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        changeTestimonialStatus: async (_: any, args: { input: { id: string; status: STATUS } }): Promise<Testimonial> => {
            try {
                const testimonialRepository = AppDataSource.getRepository(Testimonial);

                const testimonial = await testimonialRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                });
                if (testimonial) {
                    testimonial.status = args.input.status;
                    await testimonialRepository.save(testimonial);
                    return testimonial;
                } else throw createGraphQLError('Testimonial not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
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
