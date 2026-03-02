import { createGraphQLError } from 'graphql-yoga';
import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { Like } from 'typeorm';

import { Newsletter, NEWSLETTER_STATUS, NEWSLETTER_RECIPIENT_TYPE } from '../../../database/entities';
import { PaginationInput, Resource } from '../../../type';
import { getResources, returnError } from '../../../helpers/graphql';
import AppDataSource from '../../../database';
import { NewsletterService } from '../../../services/newsletter.service';

import guard from '../../middleware/graphql-guard';

import { BAD_REQUEST, NOT_FOUND } from '../../../helpers/error-constants';

const relations = ['createdBy'];

interface CreateNewsletterInput {
    subject: string;
    message: string;
    htmlMessage?: string;
    recipientTypes: NEWSLETTER_RECIPIENT_TYPE[];
    customRecipientEmails?: string[];
    attachments?: Array<{
        filename: string;
        path: string;
        contentType: string;
    }>;
    scheduledAt?: Date;
}

interface UpdateNewsletterInput {
    id: string;
    subject?: string;
    message?: string;
    htmlMessage?: string;
    recipientTypes?: NEWSLETTER_RECIPIENT_TYPE[];
    customRecipientEmails?: string[];
    attachments?: Array<{
        filename: string;
        path: string;
        contentType: string;
    }>;
    scheduledAt?: Date;
}

interface DeleteNewsletterInput {
    id: string;
}

interface SendNewsletterInput {
    id: string;
}

interface GetOneNewsletterInput {
    id: string;
}

interface CountRecipientsInput {
    recipientTypes: NEWSLETTER_RECIPIENT_TYPE[];
    customRecipientEmails?: string[];
}

interface NewsletterFilter {
    subject?: string;
    status?: NEWSLETTER_STATUS;
}

const resolver = {
    Query: {
        getNewsletters: async (
            _: any,
            args: { input: PaginationInput; filter?: NewsletterFilter }
        ): Promise<Resource<Newsletter>> => {
            try {
                let filters: any = { where: {} };

                if (args.filter) {
                    if (args.filter.subject) {
                        filters.where.subject = Like(`%${args.filter.subject}%`);
                    }
                    if (args.filter.status) {
                        filters.where.status = args.filter.status;
                    }
                }

                filters.order = { createdAt: 'DESC' };

                const res = (await getResources(Newsletter, args.input, relations, filters)) as Resource<Newsletter>;

                return res;
            } catch (error: any) {
                throw returnError(error);
            }
        },

        getOneNewsletter: async (_: any, args: { input: GetOneNewsletterInput }): Promise<Newsletter> => {
            try {
                const newsletterRepository = AppDataSource.getRepository(Newsletter);

                if (!args.input.id) {
                    throw createGraphQLError('Input id required', {
                        extensions: { statusCode: 400, statusText: BAD_REQUEST },
                    });
                }

                const newsletter = await newsletterRepository.findOne({
                    where: { id: args.input.id },
                    relations,
                });

                if (newsletter) {
                    return newsletter;
                }

                throw createGraphQLError('Newsletter not found', {
                    extensions: { statusCode: 404, statusText: NOT_FOUND },
                });
            } catch (error: any) {
                throw returnError(error);
            }
        },

        countNewsletterRecipients: async (_: any, args: { input: CountRecipientsInput }): Promise<number> => {
            try {
                const count = await NewsletterService.countRecipients(
                    args.input.recipientTypes,
                    args.input.customRecipientEmails
                );
                return count;
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },

    Mutation: {
        createNewsletter: async (_: any, args: { input: CreateNewsletterInput }, context: any): Promise<Newsletter> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const user = context.req?.session?.user;
                
                if (!user) {
                    throw createGraphQLError('User not found in session', {
                        extensions: { statusCode: 401, statusText: 'UNAUTHORIZED' },
                    });
                }

                const newNewsletter = Object.assign(new Newsletter(), {
                    ...args.input,
                    createdBy: user,
                    status: NEWSLETTER_STATUS.DRAFT,
                });

                await queryRunner.manager.save(newNewsletter);

                await queryRunner.commitTransaction();

                return newNewsletter;
            } catch (error: any) {
                await queryRunner.rollbackTransaction();
                throw returnError(error);
            } finally {
                await queryRunner.release();
            }
        },

        updateNewsletter: async (_: any, args: { input: UpdateNewsletterInput }): Promise<Newsletter> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const newsletter = await Newsletter.findOne({
                    where: { id: args.input.id },
                    relations,
                });

                if (!newsletter) {
                    throw createGraphQLError('Newsletter not found', {
                        extensions: { statusCode: 404, statusText: NOT_FOUND },
                    });
                }

                if (newsletter.status === NEWSLETTER_STATUS.SENT) {
                    throw createGraphQLError('Cannot update a sent newsletter', {
                        extensions: { statusCode: 400, statusText: BAD_REQUEST },
                    });
                }

                const updatedNewsletter = Object.assign(newsletter, args.input);
                await queryRunner.manager.save(updatedNewsletter);

                await queryRunner.commitTransaction();

                return updatedNewsletter;
            } catch (error: any) {
                await queryRunner.rollbackTransaction();
                throw returnError(error);
            } finally {
                await queryRunner.release();
            }
        },

        deleteNewsletter: async (_: any, args: { input: DeleteNewsletterInput }): Promise<{ success: boolean }> => {
            try {
                const newsletterRepository = AppDataSource.getRepository(Newsletter);

                const newsletter = await newsletterRepository.findOne({
                    where: { id: args.input.id },
                });

                if (!newsletter) {
                    throw createGraphQLError('Newsletter not found', {
                        extensions: { statusCode: 404, statusText: NOT_FOUND },
                    });
                }

                const result = await newsletterRepository.delete(newsletter.id);
                return { success: result.affected === 1 };
            } catch (error: any) {
                throw returnError(error);
            }
        },

        sendNewsletter: async (_: any, args: { input: SendNewsletterInput }): Promise<Newsletter> => {
            try {
                const newsletter = await Newsletter.findOne({
                    where: { id: args.input.id },
                    relations,
                });

                if (!newsletter) {
                    throw createGraphQLError('Newsletter not found', {
                        extensions: { statusCode: 404, statusText: NOT_FOUND },
                    });
                }

                if (newsletter.status === NEWSLETTER_STATUS.SENT) {
                    throw createGraphQLError('Newsletter already sent', {
                        extensions: { statusCode: 400, statusText: BAD_REQUEST },
                    });
                }

                // Envoyer la newsletter de manière asynchrone
                NewsletterService.sendNewsletter(newsletter.id).catch((error) => {
                    console.error('Error sending newsletter:', error);
                });

                return newsletter;
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },
};

const resolversComposition = {
    'Query.*': [guard(['admin'])],
    'Mutation.*': [guard(['admin'])],
};

export default composeResolvers(resolver, resolversComposition);
