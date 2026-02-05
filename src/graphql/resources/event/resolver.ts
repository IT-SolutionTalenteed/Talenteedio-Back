import { createGraphQLError } from 'graphql-yoga';
import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { In, Like } from 'typeorm';

import { Event, Category, User, Company } from '../../../database/entities';
import { PaginationInput, Resource, CreateEventInput, UpdateEventInput, DeleteEventInput, ChangeEventStatusInput } from '../../../type';
import { getResources, returnError } from '../../../helpers/graphql';
import AppDataSource from '../../../database';

import guard from '../../middleware/graphql-guard';
import companyGuard from '../../middleware/company-guard';

import { BAD_REQUEST, FORBIDDEN, NOT_FOUND } from '../../../helpers/error-constants';

const relations = ['admin.user', 'company', 'category', 'companies'];

const resolver = {
    Query: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getEvents: async (_: any, args: { input: PaginationInput; filter: { adminId: string; companyId: string; title: string; status: string; category: string } }, context: any): Promise<Resource<Event>> => {
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

                    if (args.filter.companyId) {
                        filters.where.company = { id: args.filter.companyId };
                    }

                    // Filtrer par catégorie (slug)
                    if (args.filter.category) {
                        filters.where.category = { slug: args.filter.category };
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

                // Si c'est un admin, on assigne l'admin
                if (user.admin) {
                    newEvent.admin = user.admin;
                }

                // Si c'est une company, on l'assigne comme propriétaire
                if (user.company) {
                    newEvent.company = user.company;
                }

                // Handle category
                if (args.input.category) {
                    const category = await Category.findOne({ where: { id: args.input.category.id } });
                    if (category) {
                        newEvent.category = category;
                    }
                }

                // Handle companies
                if (Array.isArray(args.input.companies) && args.input.companies.length) {
                    const companyIds = args.input.companies.map((company: any) => company.id);
                    const companiesToAdd = await Company.findBy({ id: In(companyIds) });
                    newEvent.companies = companiesToAdd;
                } else if (user.company) {
                    // Si c'est une company qui crée l'événement, l'ajouter automatiquement comme participante
                    newEvent.companies = [user.company];
                }

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
        updateEvent: async (_: any, args: { input: UpdateEventInput }, context: any): Promise<Event> => {
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
                    const user = context.req.session.user as User;

                    // Vérification de sécurité: une company ne peut modifier que ses propres événements
                    if (user.company && event.company?.id !== user.company.id) {
                        throw createGraphQLError('Access denied for this event', { 
                            extensions: { statusCode: 403, statusText: 'FORBIDDEN' } 
                        });
                    }

                    // Handle category update
                    if (args.input.category) {
                        const category = await Category.findOne({ where: { id: args.input.category.id } });
                        if (category) {
                            event.category = category;
                        }
                    } else if (args.input.category === null) {
                        event.category = null as any;
                    }

                    // Handle companies update
                    if (Array.isArray(args.input.companies)) {
                        if (args.input.companies.length > 0) {
                            const companyIds = args.input.companies.map((company: any) => company.id);
                            const companiesToUpdate = await Company.findBy({ id: In(companyIds) });
                            event.companies = companiesToUpdate;
                        } else {
                            // Si le tableau est vide, on supprime toutes les companies
                            event.companies = [];
                        }
                    }

                    // Update other fields
                    Object.assign(event, { 
                        ...args.input, 
                        category: undefined, 
                        companies: undefined 
                    });

                    // Save the event with the updated companies relation
                    await queryRunner.manager.save(Event, event);

                    await queryRunner.commitTransaction();

                    // Reload the event with all relations to return the updated data
                    const updatedEvent = await Event.findOne({
                        where: { id: event.id },
                        relations,
                    });

                    if (!updatedEvent) {
                        throw createGraphQLError('Event not found after update', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                    }

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
        deleteEvent: async (_: any, args: { input: DeleteEventInput }, context: any): Promise<{ success: boolean }> => {
            try {
                const eventRepository = AppDataSource.getRepository(Event);

                const event = await eventRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations,
                });

                if (event) {
                    const user = context.req.session.user as User;
                    
                    // Vérification de sécurité: une company ne peut supprimer que ses propres événements
                    if (user.company && event.company?.id !== user.company.id) {
                        throw createGraphQLError('Access denied for this event', { 
                            extensions: { statusCode: 403, statusText: 'FORBIDDEN' } 
                        });
                    }

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
    'Mutation.createEvent': [guard(['admin', 'company'])],
    'Mutation.updateEvent': [guard(['admin', 'company'])],
    'Mutation.deleteEvent': [guard(['admin', 'company'])],
};

export default composeResolvers(resolver, resolversComposition);
