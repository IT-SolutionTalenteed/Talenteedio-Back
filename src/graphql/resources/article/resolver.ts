import { createGraphQLError } from 'graphql-yoga';
import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { In, Like } from 'typeorm';

import { Article, Category, User } from '../../../database/entities';
import { PaginationInput, Resource, CreateArticleInput, UpdateArticleInput, DeleteArticleInput, ChangeArticleStatusInput } from '../../../type';
import { getResources, returnError } from '../../../helpers/graphql';
import AppDataSource from '../../../database';

import guard from '../../middleware/graphql-guard';
import companyGuard from '../../middleware/company-guard';

import { BAD_REQUEST, FORBIDDEN, NOT_FOUND } from '../../../helpers/error-constants';

const relations = ['admin.user', 'company.user', 'image', 'categories'];

const resolver = {
    Query: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getArticles: async (_: any, args: { input: PaginationInput; filter: { adminId: string; companyId: string; title: string; status: string; category: string; isPremium?: boolean } }, context: any): Promise<Resource<Article>> => {
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

                    if (args.filter.category) {
                        filters.where.categories = { name: Like(`%${args.filter.category}%`) };
                    }

                    filters.where.isPremium = args.filter.isPremium;
                } else if (!user?.admin) {
                    filters = { where: { status: 'public' } };
                }

                const res = (await getResources(Article, args.input, relations, filters)) as Resource<Article>;

                return {
                    ...res,
                    rows: res.rows.map((article) => {
                        if (article.isPremium && user?.roles?.length > 0 && user.roles[0].name !== 'admin' && user.roles[0].name !== 'hr-first-club') {
                            const data = { ...article, content: '' };
                            return data as Article;
                        }
                        return article;
                    }),
                };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOneArticle: async (_: any, args: { input: { id: string; slug: string } }, context: any): Promise<Article> => {
            try {
                const user = context.req?.session?.user as User;

                const articleRepository = AppDataSource.getRepository(Article);

                if (!args.input.id && !args.input.slug) throw createGraphQLError('Input id or slug required', { extensions: { statusCode: 400, statusText: BAD_REQUEST } });

                const article = await articleRepository.findOne({
                    where: {
                        ...(args.input.id
                            ? {
                                  id: args.input.id,
                              }
                            : { slug: args.input.slug }),
                    },
                    relations,
                });

                if (article) {
                    if (article.isPremium && user?.roles?.length > 0 && user.roles[0].name !== 'admin' && user.roles[0].name !== 'hr-first-club') {
                        const data = { ...article, content: '' };
                        return data as Article;
                    }
                    return article;
                }

                throw createGraphQLError('Article not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },

    Mutation: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createArticle: async (_: any, args: { input: CreateArticleInput }, context: any): Promise<Article> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const newArticle = Object.assign(new Article(), args.input);

                if (!newArticle.content) {
                    throw createGraphQLError('Content is required', { extensions: { statusCode: 400, statusText: BAD_REQUEST } });
                }
                if (newArticle.isPremium && !newArticle.publicContent) {
                    throw createGraphQLError('Public content is required', { extensions: { statusCode: 400, statusText: BAD_REQUEST } });
                }

                const user = context.req.session.user as User;

                newArticle.admin = user.admin;

                await queryRunner.manager.save(newArticle);

                await queryRunner.commitTransaction();

                return newArticle;

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
        updateArticle: async (_: any, args: { input: UpdateArticleInput }, context: any): Promise<Article> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const article = await Article.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations,
                });

                if (article) {
                    const user = context.req.session.user as User;

                    if (user.company && article.company?.id !== user.company.id) {
                        throw createGraphQLError('Access denied for this article', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }
                    if (!args.input.content) {
                        throw createGraphQLError('Content is required', { extensions: { statusCode: 400, statusText: BAD_REQUEST } });
                    }
                    if (args.input.isPremium && !args.input.publicContent) {
                        throw createGraphQLError('Public content is required', { extensions: { statusCode: 400, statusText: BAD_REQUEST } });
                    }

                    if (Array.isArray(args.input.categories) && args.input.categories.length) {
                        const categories = args.input.categories.map((category) => category.id);

                        const categoriesToUpdate = await Category.findBy({ id: In(categories) });

                        // Update the article's categories
                        article.categories = categoriesToUpdate;
                        await queryRunner.manager.save(article);
                    }

                    const updatedArticle = Object.assign(article, { ...args.input, categories: undefined });
                    await queryRunner.manager.save(article);

                    await queryRunner.commitTransaction();

                    return updatedArticle;
                }

                throw createGraphQLError('Article not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
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
        deleteArticle: async (_: any, args: { input: DeleteArticleInput }, context: any): Promise<{ success: boolean }> => {
            try {
                const articleRepository = AppDataSource.getRepository(Article);

                const article = await articleRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations,
                });

                if (article) {
                    const user = context.req.session.user as User;
                    if (user.company && article.company?.id !== user.company.id) {
                        throw createGraphQLError('Access denied for this article', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    const result = await articleRepository.delete(article.id);
                    return { success: result.affected === 1 };
                }

                throw createGraphQLError('Article not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        changeArticleStatus: async (_: any, args: { input: ChangeArticleStatusInput }, context: any): Promise<Article> => {
            try {
                const articleRepository = AppDataSource.getRepository(Article);
                const article = await articleRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations,
                });

                if (article) {
                    const user = context.req.session.user as User;
                    if (user.company && article.company?.id !== user.company.id) {
                        throw createGraphQLError('Access denied for this article', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    const { status } = args.input;
                    article.status = status ?? article.status;
                    await articleRepository.save(article);
                    return article;
                }

                throw createGraphQLError('Article not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },
};

const resolversComposition = {
    'Mutation.*': [guard(['admin'])],
    'Mutation.createArticle': [companyGuard('article')],
};

export default composeResolvers(resolver, resolversComposition);
