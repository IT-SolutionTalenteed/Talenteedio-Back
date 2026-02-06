import { createGraphQLError } from 'graphql-yoga';
import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { In, Like } from 'typeorm';

import { Event, Category, User, Company, EventParticipationRequest, EventUserReservation, PARTICIPATION_REQUEST_STATUS, RESERVATION_STATUS } from '../../../database/entities';
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getEventParticipationRequests: async (_: any, args: { input: PaginationInput; filter: { eventId?: string; companyId?: string; status?: PARTICIPATION_REQUEST_STATUS } }, context: any): Promise<Resource<EventParticipationRequest>> => {
            try {
                const user = context.req?.session?.user as User;
                
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let filters: any = { where: {} };

                if (args.filter) {
                    if (args.filter.eventId) {
                        filters.where.event = { id: args.filter.eventId };
                    }
                    if (args.filter.companyId) {
                        filters.where.company = { id: args.filter.companyId };
                    }
                    if (args.filter.status) {
                        filters.where.status = args.filter.status;
                    }
                }

                // Si c'est une company, elle ne voit que ses propres demandes
                if (user.company && !user.admin) {
                    filters.where.company = { id: user.company.id };
                }

                const requestRelations = ['event', 'company.user', 'company.logo', 'reviewedBy.user'];
                const res = (await getResources(EventParticipationRequest, args.input, requestRelations, filters)) as Resource<EventParticipationRequest>;

                return res;
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getEventUserReservations: async (_: any, args: { input: PaginationInput; filter: { eventId?: string; userId?: string; companyStandId?: string; status?: RESERVATION_STATUS } }, context: any): Promise<Resource<EventUserReservation>> => {
            try {
                const user = context.req?.session?.user as User;
                
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let filters: any = { where: {} };

                if (args.filter) {
                    if (args.filter.eventId) {
                        filters.where.event = { id: args.filter.eventId };
                    }
                    if (args.filter.userId) {
                        filters.where.user = { id: args.filter.userId };
                    }
                    if (args.filter.companyStandId) {
                        filters.where.companyStand = { id: args.filter.companyStandId };
                    }
                    if (args.filter.status) {
                        filters.where.status = args.filter.status;
                    }
                }

                // Si c'est un utilisateur non-admin, il ne voit que ses propres réservations
                if (!user.admin) {
                    filters.where.user = { id: user.id };
                }

                const reservationRelations = ['event', 'user', 'companyStand.user', 'companyStand.logo'];
                const res = (await getResources(EventUserReservation, args.input, reservationRelations, filters)) as Resource<EventUserReservation>;

                return res;
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getMyEventParticipationStatus: async (_: any, args: { eventId: string }, context: any): Promise<any> => {
            try {
                const user = context.req?.session?.user as User;
                
                const event = await Event.findOne({
                    where: { id: args.eventId },
                    relations: ['company', 'companies'],
                });

                if (!event) {
                    throw createGraphQLError('Event not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                }

                const response: any = {
                    isOwner: false,
                    isParticipating: false,
                    hasRequestedParticipation: false,
                    participationRequestStatus: null,
                    userReservation: null,
                };

                // Vérifier si l'utilisateur est propriétaire de l'événement
                if (user.company && event.company?.id === user.company.id) {
                    response.isOwner = true;
                }

                // Vérifier si la company participe déjà
                if (user.company && event.companies?.some(c => c.id === user.company.id)) {
                    response.isParticipating = true;
                }

                // Vérifier s'il y a une demande de participation en cours
                if (user.company) {
                    const participationRequest = await EventParticipationRequest.findOne({
                        where: {
                            event: { id: args.eventId },
                            company: { id: user.company.id },
                        },
                        order: { createdAt: 'DESC' },
                    });

                    if (participationRequest) {
                        response.hasRequestedParticipation = true;
                        response.participationRequestStatus = participationRequest.status;
                    }
                }

                // Vérifier s'il y a une réservation utilisateur
                if (!user.company && !user.admin) {
                    const reservation = await EventUserReservation.findOne({
                        where: {
                            event: { id: args.eventId },
                            user: { id: user.id },
                            status: RESERVATION_STATUS.CONFIRMED,
                        },
                        relations: ['companyStand', 'companyStand.logo'],
                    });

                    if (reservation) {
                        response.userReservation = reservation;
                    }
                }

                return response;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        requestEventParticipation: async (_: any, args: { input: { eventId: string; message?: string } }, context: any): Promise<EventParticipationRequest> => {
            try {
                const user = context.req.session.user as User;

                if (!user.company) {
                    throw createGraphQLError('Only companies can request event participation', { 
                        extensions: { statusCode: 403, statusText: FORBIDDEN } 
                    });
                }

                const event = await Event.findOne({
                    where: { id: args.input.eventId },
                    relations: ['company', 'companies'],
                });

                if (!event) {
                    throw createGraphQLError('Event not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                }

                // Vérifier si la company est déjà propriétaire ou participante
                if (event.company?.id === user.company.id) {
                    throw createGraphQLError('You are the owner of this event', { 
                        extensions: { statusCode: 400, statusText: BAD_REQUEST } 
                    });
                }

                if (event.companies?.some(c => c.id === user.company.id)) {
                    throw createGraphQLError('You are already participating in this event', { 
                        extensions: { statusCode: 400, statusText: BAD_REQUEST } 
                    });
                }

                // Vérifier s'il y a déjà une demande en attente
                const existingRequest = await EventParticipationRequest.findOne({
                    where: {
                        event: { id: args.input.eventId },
                        company: { id: user.company.id },
                        status: PARTICIPATION_REQUEST_STATUS.PENDING,
                    },
                });

                if (existingRequest) {
                    throw createGraphQLError('You already have a pending participation request for this event', { 
                        extensions: { statusCode: 400, statusText: BAD_REQUEST } 
                    });
                }

                const newRequest = Object.assign(new EventParticipationRequest(), {
                    event,
                    company: user.company,
                    message: args.input.message,
                    status: PARTICIPATION_REQUEST_STATUS.PENDING,
                });

                await newRequest.save();

                // Recharger avec les relations
                const savedRequest = await EventParticipationRequest.findOne({
                    where: { id: newRequest.id },
                    relations: ['event', 'company.user', 'company.logo'],
                });

                return savedRequest!;
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reviewParticipationRequest: async (_: any, args: { input: { requestId: string; status: PARTICIPATION_REQUEST_STATUS; adminNote?: string } }, context: any): Promise<EventParticipationRequest> => {
            const queryRunner = AppDataSource.createQueryRunner();
            await queryRunner.startTransaction();

            try {
                const user = context.req.session.user as User;

                if (!user.admin) {
                    throw createGraphQLError('Only admins can review participation requests', { 
                        extensions: { statusCode: 403, statusText: FORBIDDEN } 
                    });
                }

                const request = await EventParticipationRequest.findOne({
                    where: { id: args.input.requestId },
                    relations: ['event', 'company', 'event.companies'],
                });

                if (!request) {
                    throw createGraphQLError('Participation request not found', { 
                        extensions: { statusCode: 404, statusText: NOT_FOUND } 
                    });
                }

                if (request.status !== PARTICIPATION_REQUEST_STATUS.PENDING) {
                    throw createGraphQLError('This request has already been reviewed', { 
                        extensions: { statusCode: 400, statusText: BAD_REQUEST } 
                    });
                }

                request.status = args.input.status;
                if (args.input.adminNote) {
                    request.adminNote = args.input.adminNote;
                }
                request.reviewedBy = user.admin;
                request.reviewedAt = new Date();

                await queryRunner.manager.save(request);

                // Si approuvé, ajouter la company aux participants de l'événement
                if (args.input.status === PARTICIPATION_REQUEST_STATUS.APPROVED) {
                    const event = request.event;
                    if (!event.companies) {
                        event.companies = [];
                    }
                    
                    // Vérifier si la company n'est pas déjà dans la liste
                    if (!event.companies.some(c => c.id === request.company.id)) {
                        event.companies.push(request.company);
                        await queryRunner.manager.save(Event, event);
                    }
                }

                await queryRunner.commitTransaction();

                // Recharger avec toutes les relations
                const updatedRequest = await EventParticipationRequest.findOne({
                    where: { id: request.id },
                    relations: ['event', 'company.user', 'company.logo', 'reviewedBy.user'],
                });

                return updatedRequest!;
            } catch (error: any) {
                await queryRunner.rollbackTransaction();
                throw returnError(error);
            } finally {
                await queryRunner.release();
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createEventReservation: async (_: any, args: { input: { eventId: string; companyStandId: string; notes?: string } }, context: any): Promise<EventUserReservation> => {
            try {
                const user = context.req.session.user as User;

                // Vérifier que l'utilisateur n'est pas une company ou admin
                if (user.company || user.admin) {
                    throw createGraphQLError('Companies and admins cannot make reservations', { 
                        extensions: { statusCode: 403, statusText: FORBIDDEN } 
                    });
                }

                const event = await Event.findOne({
                    where: { id: args.input.eventId },
                    relations: ['companies'],
                });

                if (!event) {
                    throw createGraphQLError('Event not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                }

                // Vérifier que la company participe à l'événement
                const companyStand = await Company.findOne({
                    where: { id: args.input.companyStandId },
                });

                if (!companyStand) {
                    throw createGraphQLError('Company not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                }

                if (!event.companies?.some(c => c.id === companyStand.id)) {
                    throw createGraphQLError('This company is not participating in this event', { 
                        extensions: { statusCode: 400, statusText: BAD_REQUEST } 
                    });
                }

                // Vérifier s'il y a déjà une réservation active
                const existingReservation = await EventUserReservation.findOne({
                    where: {
                        event: { id: args.input.eventId },
                        user: { id: user.id },
                        status: RESERVATION_STATUS.CONFIRMED,
                    },
                });

                if (existingReservation) {
                    throw createGraphQLError('You already have an active reservation for this event', { 
                        extensions: { statusCode: 400, statusText: BAD_REQUEST } 
                    });
                }

                const newReservation = Object.assign(new EventUserReservation(), {
                    event,
                    user,
                    companyStand,
                    notes: args.input.notes,
                    status: RESERVATION_STATUS.CONFIRMED,
                });

                await newReservation.save();

                // Recharger avec les relations
                const savedReservation = await EventUserReservation.findOne({
                    where: { id: newReservation.id },
                    relations: ['event', 'user', 'companyStand.user', 'companyStand.logo'],
                });

                return savedReservation!;
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cancelEventReservation: async (_: any, args: { reservationId: string }, context: any): Promise<EventUserReservation> => {
            try {
                const user = context.req.session.user as User;

                const reservation = await EventUserReservation.findOne({
                    where: { id: args.reservationId },
                    relations: ['user', 'event', 'companyStand.user', 'companyStand.logo'],
                });

                if (!reservation) {
                    throw createGraphQLError('Reservation not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                }

                // Vérifier que l'utilisateur est le propriétaire de la réservation ou un admin
                if (!user.admin && reservation.user.id !== user.id) {
                    throw createGraphQLError('You can only cancel your own reservations', { 
                        extensions: { statusCode: 403, statusText: FORBIDDEN } 
                    });
                }

                reservation.status = RESERVATION_STATUS.CANCELLED;
                await reservation.save();

                return reservation;
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
    'Mutation.requestEventParticipation': [guard(['company'])],
    'Mutation.reviewParticipationRequest': [guard(['admin'])],
    'Mutation.createEventReservation': [guard(['talent', 'freelance', 'consultant', 'referral', 'hr-first-club'])],
    'Mutation.cancelEventReservation': [guard(['talent', 'freelance', 'consultant', 'referral', 'hr-first-club', 'admin'])],
    'Query.getEventParticipationRequests': [guard(['admin', 'company'])],
    'Query.getEventUserReservations': [guard(['admin', 'talent', 'freelance', 'consultant', 'referral', 'hr-first-club'])],
    'Query.getMyEventParticipationStatus': [guard(['admin', 'company', 'talent', 'freelance', 'consultant', 'referral', 'hr-first-club'])],
};

export default composeResolvers(resolver, resolversComposition);
