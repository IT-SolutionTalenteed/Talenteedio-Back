import { createGraphQLError } from 'graphql-yoga';
import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { In, Like } from 'typeorm';

import { Event, Category, User } from '../../../database/entities';
import { PaginationInput, Resource, CreateEventInput, UpdateEventInput, DeleteEventInput, ChangeEventStatusInput } from '../../../type';
import { getResources, returnError } from '../../../helpers/graphql';
import AppDataSource from '../../../database';

import guard from '../../middleware/graphql-guard';

import { BAD_REQUEST, NOT_FOUND } from '../../../helpers/error-constants';

const relations = ['admin.user', 'categories'];

const resolver = {
    Query: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getEvents: async (_: any, args: { input: PaginationInput; filter: { adminId: string; title: string; status: string } }, context: any): Promise<Resource<Event>> => {
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

                const res = (await getResources(Event, args.input, relations, filters)) as Resource<Event>;

                return res;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOneEvent: async (_: any, args: { input: { id: string; slug: string } }): Promise<Event> => {
            try {
                const eventRepository = AppDataSource.getRepository(Event);

                if (!args.input.id && !args.input.slug) throw createGraphQLError('Input id or slug required', { extensions: { statusCode: 400, statusText: BAD_REQUEST } });

                const event = await eventRepository.findOne({
                    where: {
                        ...(args.input.id
                            ? {
                                  id: args.input.id,
                              }
                            : { slug: args.input.slug }),
                    },
                    relations,
                });

                if (event) {
                    return event;
                }

                throw createGraphQLError('Event not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },

    Mutation: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createEvent: async (_: any, args: { input: CreateEventInput }, context: any): Promise<Event> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const newEvent = Object.assign(new Event(), args.input);

                const user = context.req.session.user as User;

                newEvent.admin = user.admin;

                await queryRunner.manager.save(newEvent);

                await queryRunner.commitTransaction();

                return newEvent;

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
        updateEvent: async (_: any, args: { input: UpdateEventInput }): Promise<Event> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const event = await Event.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations,
                });

                if (event) {
                    if (Array.isArray(args.input.categories) && args.input.categories.length) {
                        const categories = args.input.categories.map((category) => category.id);

                        const categoriesToUpdate = await Category.findBy({ id: In(categories) });

                        // Update the event's categories
                        event.categories = categoriesToUpdate;
                        await queryRunner.manager.save(event);
                    }

                    const updatedEvent = Object.assign(event, { ...args.input, categories: undefined });
                    await queryRunner.manager.save(event);

                    await queryRunner.commitTransaction();

                    return updatedEvent;
                }

                throw createGraphQLError('Event not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
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
        deleteEvent: async (_: any, args: { input: DeleteEventInput }): Promise<{ success: boolean }> => {
            try {
                const eventRepository = AppDataSource.getRepository(Event);

                const event = await eventRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations,
                });

                if (event) {
                    const result = await eventRepository.delete(event.id);
                    return { success: result.affected === 1 };
                }

                throw createGraphQLError('Event not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        changeEventStatus: async (_: any, args: { input: ChangeEventStatusInput }): Promise<Event> => {
            try {
                const eventRepository = AppDataSource.getRepository(Event);
                const event = await eventRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations,
                });

                if (event) {
                    const { status } = args.input;
                    event.status = status ?? event.status;
                    await eventRepository.save(event);
                    return event;
                }

                throw createGraphQLError('Event not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

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
