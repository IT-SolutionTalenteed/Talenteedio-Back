import { createGraphQLError } from 'graphql-yoga';
import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { Like } from 'typeorm';

import { getResources, returnError } from '../../../helpers/graphql';
import { PaginationInput, Resource, CreateSkillInput, UpdateSkillInput } from '../../../type';
import { NOT_FOUND } from '../../../helpers/error-constants';
import AppDataSource from '../../../database';
import { STATUS } from '../../../database/entities/Status';
import graphqlGuard from '../../middleware/graphql-guard';
import { User, Skill } from '../../../database/entities';

const resolver = {
    Query: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getSkills: async (_: any, args: { input: PaginationInput; filter: { name: string; status: string } }, context: any): Promise<Resource<Skill>> => {
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

                const res = (await getResources(Skill, args.input, [], filters)) as Resource<Skill>;

                return res;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOneSkill: async (_: any, args: { input: { id: string } }): Promise<Skill> => {
            try {
                const skillRepository = AppDataSource.getRepository(Skill);
                const skill = await skillRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                });

                if (skill) {
                    return skill;
                } else {
                    throw createGraphQLError('Skill not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },
    Mutation: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createSkill: async (_: any, args: { input: CreateSkillInput }): Promise<Skill> => {
            try {
                const skill = new Skill();
                skill.name = args.input.name;
                if (args.input.status) {
                    skill.status = args.input.status;
                }
                const skillRepository = AppDataSource.getRepository(Skill);
                await skillRepository.save(skill);

                return skill;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateSkill: async (_: any, args: { input: UpdateSkillInput }): Promise<Skill> => {
            try {
                const skillRepository = AppDataSource.getRepository(Skill);
                const skill = await skillRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                });
                if (skill) {
                    if (args.input.name) skill.name = args.input.name;
                    if (args.input.status) skill.status = args.input.status;
                    await skillRepository.save(skill);
                    return skill;
                } else throw createGraphQLError('Skill not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deleteSkill: async (_: any, args: { input: { id: string } }): Promise<{ success: boolean }> => {
            try {
                const skillRepository = AppDataSource.getRepository(Skill);
                const result = await skillRepository.delete(args.input.id);

                if (result.affected === 1) {
                    return { success: true };
                }

                throw createGraphQLError('Skill not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        changeSkillStatus: async (_: any, args: { input: { id: string; status: STATUS } }): Promise<Skill> => {
            try {
                const skillRepository = AppDataSource.getRepository(Skill);

                const skill = await skillRepository.findOne({
                    where: {
                        id: args.input.id,
                    },
                });
                if (skill) {
                    skill.status = args.input.status;
                    await skillRepository.save(skill);
                    return skill;
                } else throw createGraphQLError('Skill not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
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
