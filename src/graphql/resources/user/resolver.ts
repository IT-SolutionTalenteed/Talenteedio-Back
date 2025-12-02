import { HrFirstClub } from './../../../database/entities/HrFirstClub';
import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { FindManyOptions, In, IsNull, Like } from 'typeorm';
import { createGraphQLError } from 'graphql-yoga';

import { Address, Admin, Company, Contact, Referral, Freelance, Consultant, Talent, User, Skill, CV, LM, Media, Value } from '../../../database/entities';
import { CreateCVInput, UploadCVInput, CreateCompanyInput, CreateLMInput, CreateReferralInput, CreateTalentInput, CreateFreelanceInput, CreateConsultantInput, CreateUserInput, PaginationInput, Payload, Resource, RoleName, UpdateCVInput, UpdateCompanyInput, UpdateLMInput, UpdateReferralInput, UpdateTalentInput, UpdateFreelanceInput, UpdateConsultantInput, UpdateUserInput, CreateHrFirstClubInput, UpdateHrFirstClubInput } from '../../../type';
import { getResources, returnError } from '../../../helpers/graphql';

import guard from '../../middleware/graphql-guard';

import AppDataSource from '../../../database';

import { BAD_REQUEST, FORBIDDEN, NOT_FOUND } from '../../../helpers/error-constants';
import { generateCVtoPdf, generateConsentForTalent, generateLMtoPdf } from '../../../helpers/generatePdf';
import transporter from '../../../helpers/mailer';
import path from 'path';

const relations = ['admin', 'company', 'talent', 'freelance', 'consultant', 'referral', 'profilePicture'];
const companyRelations = ['user', 'contact.address', 'articles', 'logo', 'category', 'jobs.applications', 'permission'];
const referralRelations = ['user', 'contact.address', 'category', 'applications'];
const hrFirstClubRelations = ['user', 'contact.address', 'logo'];
const talentRelations = ['user', 'contact.address', 'category', 'skills', 'applications', 'cvs', 'lms', 'consent', 'values'];
const freelanceRelations = ['user', 'contact.address', 'category', 'applications', 'cvs', 'lms', 'values'];
const consultantRelations = ['user', 'contact.address', 'category', 'applications', 'cvs', 'lms', 'values'];

const resolver = {
    Query: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getUsers: async (_: any, args: { input: PaginationInput; filter: { roles: RoleName[]; name: string; email: string; withoutRole: boolean } }): Promise<Resource<User>> => {
            try {
                let filters: FindManyOptions<User> | undefined = undefined;

                if (args.filter?.name || args.filter?.email || args.filter?.withoutRole) {
                    const firstnameConditions = args.filter.name ? { firstname: Like(`%${args.filter.name}%`) } : {};
                    const lastnameConditions = args.filter.name ? { lastname: Like(`%${args.filter.name}%`) } : {};
                    const emailConditions = args.filter.email ? { email: Like(`%${args.filter.email}%`) } : {};

                    const nullConditions = args.filter.withoutRole
                        ? {
                              company: { id: IsNull() },
                              admin: { id: IsNull() },
                              talent: { id: IsNull() },
                              referral: { id: IsNull() },
                          }
                        : {};

                    filters = {
                        where: [
                            { ...firstnameConditions, ...nullConditions },
                            { ...lastnameConditions, ...nullConditions },
                            { ...emailConditions, ...nullConditions },
                        ],
                    };
                }

                const res = (await getResources(User, args.input, relations, filters)) as Resource<User>;

                return res;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOneUser: async (_: any, args: { input: { id: string } }, context: any): Promise<User> => {
            try {
                const user = await User.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: relations,
                });

                if (user) {
                    const loggedUser = context.req.session.user as User;

                    if (!loggedUser.admin && user.id !== loggedUser.id) {
                        throw createGraphQLError('Access denied for this user', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    return user;
                }

                throw createGraphQLError('User not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        getTotalUsers: async (): Promise<number> => {
            try {
                return await User.count();
            } catch (error) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getCompanies: async (_: any, args: { input: PaginationInput; filter: { name: string; status: string } }): Promise<Resource<Company>> => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let filters: any;

                if (args.filter) {
                    filters = args.filter.name ? { where: { company_name: Like(`%${args.filter.name}%`) } } : { where: {} };

                    if (args.filter.status) {
                        filters.where.status = args.filter.status;
                    }
                }

                const res = (await getResources(Company, args.input, companyRelations, filters)) as Resource<Company>;

                return res;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOneCompany: async (_: any, args: { input: { id: string } }, context: any): Promise<Company> => {
            try {
                const company = await Company.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: companyRelations,
                });

                if (company) {
                    const user = context.req.session.user as User;

                    if (user.company && company.id !== user.company.id) {
                        throw createGraphQLError('Access denied for this company', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    return company;
                }

                throw createGraphQLError('Company not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        }, // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getReferrals: async (_: any, args: { input: PaginationInput; filter: { name: string; status: string } }): Promise<Resource<Referral>> => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let filters: any;

                if (args.filter) {
                    filters = args.filter.name ? { where: { title: Like(`%${args.filter.name}%`) } } : { where: {} };

                    if (args.filter.status) {
                        filters.where.status = args.filter.status;
                    }
                }

                const res = (await getResources(Referral, args.input, referralRelations, filters)) as Resource<Referral>;

                return res;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOneReferral: async (_: any, args: { input: { id: string } }, context: any): Promise<Referral> => {
            try {
                const referral = await Referral.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: referralRelations,
                });

                if (referral) {
                    const user = context.req.session.user as User;

                    if (user.referral && referral.id !== user.referral.id) {
                        throw createGraphQLError('Access denied for this referral', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    return referral;
                }

                throw createGraphQLError('Referral not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getHrFirstClubs: async (_: any, args: { input: PaginationInput; filter: { companyName: string; status: string } }): Promise<Resource<HrFirstClub>> => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let filters: any;

                if (args.filter) {
                    filters = args.filter.companyName ? { where: { companyName: Like(`%${args.filter.companyName}%`) } } : { where: {} };

                    if (args.filter.status) {
                        filters.where.status = args.filter.status;
                    }
                }

                const res = (await getResources(HrFirstClub, args.input, hrFirstClubRelations, filters)) as Resource<HrFirstClub>;

                return res;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOneHrFirstClub: async (_: any, args: { input: { id: string } }, context: any): Promise<HrFirstClub> => {
            try {
                const hrFirstClub = await HrFirstClub.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: hrFirstClubRelations,
                });

                if (hrFirstClub) {
                    const user = context.req.session.user as User;

                    if (user.hrFirstClub && hrFirstClub.id !== user.hrFirstClub.id) {
                        throw createGraphQLError('Access denied for this hr first club', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    return hrFirstClub;
                }

                throw createGraphQLError('Hr first club not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getTalents: async (_: any, args: { input: PaginationInput; filter: { name: string; status: string } }): Promise<Resource<Talent>> => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let filters: any;

                if (args.filter) {
                    filters = args.filter.name ? { where: { title: Like(`%${args.filter.name}%`) } } : { where: {} };

                    if (args.filter.status) {
                        filters.where.status = args.filter.status;
                    }
                }

                const res = (await getResources(Talent, args.input, referralRelations, filters)) as Resource<Talent>;

                return res;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOneTalent: async (_: any, args: { input: { id: string } }, context: any): Promise<Talent> => {
            try {
                const talent = await Talent.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: talentRelations,
                });

                if (talent) {
                    const user = context.req.session.user as User;

                    if (user.talent && talent.id !== user.talent.id) {
                        throw createGraphQLError('Access denied for this talent', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    return talent;
                }

                throw createGraphQLError('Talent not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getFreelances: async (_: any, args: { input: PaginationInput; filter: { name: string; status: string } }): Promise<Resource<Freelance>> => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let filters: any;

                if (args.filter) {
                    filters = args.filter.name ? { where: { title: Like(`%${args.filter.name}%`) } } : { where: {} };

                    if (args.filter.status) {
                        filters.where.status = args.filter.status;
                    }
                }

                const res = (await getResources(Freelance, args.input, freelanceRelations, filters)) as Resource<Freelance>;

                return res;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOneFreelance: async (_: any, args: { input: { id: string } }, context: any): Promise<Freelance> => {
            try {
                const freelance = await Freelance.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: freelanceRelations,
                });

                if (freelance) {
                    const user = context.req.session.user as User;

                    if (user.freelance && freelance.id !== user.freelance.id) {
                        throw createGraphQLError('Access denied for this freelance', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    return freelance;
                }

                throw createGraphQLError('Freelance not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getConsultants: async (_: any, args: { input: PaginationInput; filter: { name: string; status: string } }): Promise<Resource<Consultant>> => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let filters: any;

                if (args.filter) {
                    filters = args.filter.name ? { where: { title: Like(`%${args.filter.name}%`) } } : { where: {} };

                    if (args.filter.status) {
                        filters.where.status = args.filter.status;
                    }
                }

                const res = (await getResources(Consultant, args.input, consultantRelations, filters)) as Resource<Consultant>;

                return res;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOneConsultant: async (_: any, args: { input: { id: string } }, context: any): Promise<Consultant> => {
            try {
                const consultant = await Consultant.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: consultantRelations,
                });

                if (consultant) {
                    const user = context.req.session.user as User;

                    if (user.consultant && consultant.id !== user.consultant.id) {
                        throw createGraphQLError('Access denied for this consultant', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    return consultant;
                }

                throw createGraphQLError('Consultant not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getCVs: async (_: any, args: { input: PaginationInput; filter: { title: string; talentId: string } }, context: any): Promise<Resource<CV>> => {
            try {
                const loggedUser = context.req.session.user as User;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const filters: any = loggedUser.admin ? {} : { where: { talent: { id: loggedUser.talent.id } } };

                if (args.filter?.title) {
                    filters.where = filters.where ? filters.where : {};
                    filters.where.title = Like(`%${args.filter.title}%`);
                }

                if (loggedUser.admin && args.filter?.talentId) {
                    filters.where = filters.where ? filters.where : {};
                    filters.where.talent = { id: args.filter.talentId };
                }

                const res = (await getResources(CV, args.input, ['file'], filters)) as Resource<CV>;

                return res;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOneCV: async (_: any, args: { input: { id: string } }, context: any): Promise<CV> => {
            try {
                const cv = await CV.findOne({
                    where: {
                        id: args.input.id,
                    },

                    relations: ['talent', 'file'],
                });

                if (cv) {
                    const user = context.req.session.user as User;

                    if (!user.admin && cv.talent.id !== user.talent.id) {
                        throw createGraphQLError('Access denied for this cv', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    return cv;
                }

                throw createGraphQLError('CV not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        generateCV: async (_: any, args: { input: { id: string } }): Promise<string> => {
            try {
                const cv = await CV.findOne({
                    where: {
                        id: args.input.id,
                    },

                    relations: ['talent', 'talent.values'],
                });

                if (cv && !cv.file) {
                    return await generateCVtoPdf(cv);
                }

                throw createGraphQLError('CV not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getLMs: async (_: any, args: { input: PaginationInput; filter: { title: string; talentId: string } }, context: any): Promise<Resource<LM>> => {
            try {
                const loggedUser = context.req.session.user as User;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const filters: any = loggedUser.admin ? {} : { where: { talent: { id: loggedUser.talent.id } } };

                if (args.filter?.title) {
                    filters.where = filters.where ? filters.where : {};
                    filters.where.title = Like(`%${args.filter.title}%`);
                }

                if (loggedUser.admin && args.filter?.talentId) {
                    filters.where = filters.where ? filters.where : {};
                    filters.where.talent = { id: args.filter.talentId };
                }

                const res = (await getResources(LM, args.input, undefined, filters)) as Resource<LM>;

                return res;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOneLM: async (_: any, args: { input: { id: string } }, context: any): Promise<LM> => {
            try {
                const lm = await LM.findOne({
                    where: {
                        id: args.input.id,
                    },

                    relations: ['talent'],
                });

                if (lm) {
                    const user = context.req.session.user as User;

                    if (!user.admin && lm.talent.id !== user.talent.id) {
                        throw createGraphQLError('Access denied for this lm', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    return lm;
                }

                throw createGraphQLError('LM not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        generateLM: async (_: any, args: { input: { id: string } }): Promise<string> => {
            try {
                const lm = await LM.findOne({
                    where: {
                        id: args.input.id,
                    },

                    relations: ['talent'],
                });

                if (lm) {
                    return await generateLMtoPdf(lm);
                }

                throw createGraphQLError('LM not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },
    Mutation: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createUser: async (_: any, args: { input: CreateUserInput }): Promise<User> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const user = Object.assign(new User(), args.input) as User;

                if (args.input?.role === 'admin') {
                    user.admin = new Admin();
                    await queryRunner.manager.save(user.admin);
                    user.validateAt = new Date();
                }

                await queryRunner.manager.save(user);

                await queryRunner.commitTransaction();

                return user;
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
        updateUser: async (_: any, args: { input: UpdateUserInput }, context: any): Promise<User> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const user = await User.findOne({ where: { id: args.input.id }, select: ['password', 'id'] });

                if (user) {
                    const loggedUser = context.req.session.user as User;

                    if (!loggedUser.admin) {
                        if (user.id !== loggedUser.id) throw createGraphQLError('Access denied for this user', { extensions: { statusCode: 403, statusText: FORBIDDEN } });

                        if (args.input.password) {
                            if (!args.input.oldPassword) throw createGraphQLError('Old password required', { extensions: { statusCode: 403, statusText: FORBIDDEN } });

                            if (!(await user.checkPasswd(args.input.oldPassword))) throw createGraphQLError('Wrong password', { extensions: { statusCode: 403, statusText: FORBIDDEN } });

                            if (!args.input.confirmPassword || args.input.confirmPassword !== args.input.password) throw createGraphQLError("Confirm password doesn't match", { extensions: { statusCode: 400, statusText: BAD_REQUEST } });
                        }
                    }

                    let updatedUser = (await User.findOne({
                        where: {
                            id: args.input.id,
                        },
                        relations: [...relations, 'consultant'],
                    })) as User;

                    const wasNotVerified = !updatedUser.validateAt;
                    const willBeVerified = args.input.validateAt;

                    updatedUser = Object.assign(updatedUser, args.input);

                    if (args.input?.role === 'admin' && !user.roles?.length) {
                        updatedUser.admin = new Admin();
                        await queryRunner.manager.save(updatedUser.admin);
                    }

                    // Handle profile picture
                    if (args.input.profilePicture !== undefined) {
                        if (args.input.profilePicture?.id) {
                            const media = await Media.findOne({ where: { id: args.input.profilePicture.id } });
                            if (media) {
                                updatedUser.profilePicture = media;
                            }
                        } else {
                            // @ts-ignore - Allow setting null to remove profile picture
                            updatedUser.profilePicture = null;
                        }
                    }

                    await queryRunner.manager.save(updatedUser);

                    // Send validation email to consultant
                    if (wasNotVerified && willBeVerified && updatedUser.consultant) {
                        try {
                            await transporter.sendMail({
                                from: 'Talenteed.io ' + process.env.MAILUSER,
                                to: updatedUser.email,
                                subject: 'Votre compte consultant a été validé',
                                template: 'index',
                                context: {
                                    title: `Bonjour ${updatedUser.firstname} ${updatedUser.lastname}`,
                                    message: `Bonne nouvelle ! Votre compte consultant a été validé par notre équipe. Vous pouvez maintenant vous connecter et accéder à toutes les fonctionnalités de la plateforme.`,
                                    host: process.env.FRONTEND_HOST,
                                    imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                                    imageTitle: 'Compte validé',
                                    backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
                                },
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            } as any);
                        } catch (emailError) {
                            console.error('Failed to send validation email:', emailError);
                            // Don't throw error, just log it
                        }
                    }

                    await queryRunner.commitTransaction();

                    return updatedUser;
                }

                throw createGraphQLError('User not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

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
        deleteUser: async (_: any, args: { input: { id: string } }, context: any): Promise<Payload> => {
            try {
                const user = await User.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: relations,
                });

                if (user) {
                    const loggedUser = context.req.session.user as User;

                    if (!loggedUser.admin && user.id !== loggedUser.id) {
                        throw createGraphQLError('Access denied for this user', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    const result = await User.delete(args.input.id);

                    if (result.affected === 1) {
                        return { success: true };
                    }
                }

                throw createGraphQLError('User not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createCompany: async (_: any, args: { input: CreateCompanyInput }): Promise<Company> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const company = Object.assign(new Company(), { ...args.input, contact: undefined }) as Company;

                const address = Address.create(args.input.contact.address);
                await queryRunner.manager.save(address);

                const contact = Contact.create(args.input.contact);
                contact.address = address;
                await queryRunner.manager.save(contact);

                company.contact = contact;
                await queryRunner.manager.save(company);

                await queryRunner.commitTransaction();

                const user = (await User.findOne({ where: { id: args.input.user.id } })) as User;

                user.validateAt = new Date();

                await user.save();

                return company;
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
        updateCompany: async (_: any, args: { input: UpdateCompanyInput }, context: any): Promise<Company> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                let company = await Company.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: companyRelations,
                });

                if (company) {
                    const user = context.req.session.user as User;

                    if (!user.admin && (!user.company || company?.id !== user.company.id)) {
                        throw createGraphQLError('Access denied for this company', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    if (args.input.contact) {
                        if (args.input.contact.address) {
                            const address = Object.assign(company.contact.address, args.input.contact.address) as Address;
                            await queryRunner.manager.save(address);
                        }

                        const contact = Object.assign(company.contact, { ...args.input.contact, address: undefined }) as Contact;
                        await queryRunner.manager.save(contact);
                    }

                    company = Object.assign(company, { ...args.input, contact: undefined }) as Company;
                    await queryRunner.manager.save(company);

                    await queryRunner.commitTransaction();

                    return company;
                }

                throw createGraphQLError('Company not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

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
        deleteCompany: async (_: any, args: { input: { id: string } }, context: any): Promise<Payload> => {
            try {
                const company = await Company.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: companyRelations,
                });

                if (company) {
                    const user = context.req.session.user as User;

                    if (!user.admin && (!user.company || company?.id !== user.company.id)) {
                        throw createGraphQLError('Access denied for this company', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    const result = await Company.delete(args.input.id);

                    if (result.affected === 1) {
                        return { success: true };
                    }
                }

                throw createGraphQLError('Company not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createReferral: async (_: any, args: { input: CreateReferralInput }): Promise<Referral> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const address = Address.create(args.input.contact.address);
                await queryRunner.manager.save(address);

                const contact = Contact.create(args.input.contact);
                contact.address = address;
                await queryRunner.manager.save(contact);

                const referral = Object.assign(new Referral(), { ...args.input, contact: undefined }) as Referral;
                referral.contact = contact;
                await queryRunner.manager.save(referral);

                const user = (await User.findOne({ where: { id: args.input.user.id } })) as User;

                user.validateAt = new Date();

                await queryRunner.manager.save(user);

                await queryRunner.commitTransaction();

                return referral;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                await queryRunner.rollbackTransaction();
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateReferral: async (_: any, args: { input: UpdateReferralInput }, context: any): Promise<Referral> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                let referral = await Referral.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: referralRelations,
                });

                if (referral) {
                    const user = context.req.session.user as User;

                    if (!user.admin && (!user.referral || referral?.id !== user.referral.id)) {
                        throw createGraphQLError('Access denied for this referral', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    if (args.input.contact) {
                        if (referral.contact) {
                            if (args.input.contact.address) {
                                if (referral.contact.address) {
                                    const address = Object.assign(referral.contact.address, args.input.contact.address) as Address;
                                    await queryRunner.manager.save(address);
                                } else {
                                    const address = Address.create(args.input.contact.address);
                                    await queryRunner.manager.save(address);
                                    referral.contact.address = address;
                                    await queryRunner.manager.save(referral.contact);
                                }
                            }

                            const contact = Object.assign(referral.contact, { ...args.input.contact, address: undefined }) as Contact;
                            await queryRunner.manager.save(contact);
                        } else {
                            const address = Address.create(args.input.contact.address);
                            await queryRunner.manager.save(address);

                            const contact = Contact.create({ ...args.input.contact, address: undefined });
                            contact.address = address;
                            await queryRunner.manager.save(contact);

                            referral.contact = contact;
                            await queryRunner.manager.save(referral);
                        }
                    }

                    referral = Object.assign(referral, { ...args.input, contact: undefined }) as Referral;
                    await queryRunner.manager.save(referral);

                    await queryRunner.commitTransaction();

                    return referral;
                }

                throw createGraphQLError('Referral not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

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
        deleteReferral: async (_: any, args: { input: { id: string } }, context: any): Promise<Payload> => {
            try {
                const referral = await Referral.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: referralRelations,
                });

                if (referral) {
                    const user = context.req.session.user as User;

                    if (!user.admin && (!user.referral || referral?.id !== user.referral.id)) {
                        throw createGraphQLError('Access denied for this referral', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    const result = await Referral.delete(args.input.id);

                    if (result.affected === 1) {
                        return { success: true };
                    }
                }

                throw createGraphQLError('Referral not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createHrFirstClub: async (_: any, args: { input: CreateHrFirstClubInput }): Promise<HrFirstClub> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const address = Address.create(args.input.contact.address);
                await queryRunner.manager.save(address);

                const contact = Contact.create(args.input.contact);
                contact.address = address;
                await queryRunner.manager.save(contact);

                const hrFirstClub = Object.assign(new HrFirstClub(), { ...args.input, contact: undefined }) as HrFirstClub;
                hrFirstClub.contact = contact;
                await queryRunner.manager.save(hrFirstClub);

                const user = (await User.findOne({ where: { id: args.input.user.id } })) as User;

                user.validateAt = new Date();

                await queryRunner.manager.save(user);

                await queryRunner.commitTransaction();

                return hrFirstClub;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                await queryRunner.rollbackTransaction();
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateHrFirstClub: async (_: any, args: { input: UpdateHrFirstClubInput }, context: any): Promise<HrFirstClub> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                let hrFirstClub = await HrFirstClub.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: hrFirstClubRelations,
                });

                if (hrFirstClub) {
                    const user = context.req.session.user as User;

                    if (!user.admin && (!user.hrFirstClub || hrFirstClub?.id !== user.hrFirstClub.id)) {
                        throw createGraphQLError('Access denied for this hr first club', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    if (args.input.contact) {
                        if (hrFirstClub.contact) {
                            if (args.input.contact.address) {
                                if (hrFirstClub.contact.address) {
                                    const address = Object.assign(hrFirstClub.contact.address, args.input.contact.address) as Address;
                                    await queryRunner.manager.save(address);
                                } else {
                                    const address = Address.create(args.input.contact.address);
                                    await queryRunner.manager.save(address);
                                    hrFirstClub.contact.address = address;
                                    await queryRunner.manager.save(hrFirstClub.contact);
                                }
                            }

                            const contact = Object.assign(hrFirstClub.contact, { ...args.input.contact, address: undefined }) as Contact;
                            await queryRunner.manager.save(contact);
                        } else {
                            const address = Address.create(args.input.contact.address);
                            await queryRunner.manager.save(address);

                            const contact = Contact.create({ ...args.input.contact, address: undefined });
                            contact.address = address;
                            await queryRunner.manager.save(contact);

                            hrFirstClub.contact = contact;
                            await queryRunner.manager.save(hrFirstClub);
                        }
                    }

                    hrFirstClub = Object.assign(hrFirstClub, { ...args.input, contact: undefined }) as HrFirstClub;
                    await queryRunner.manager.save(hrFirstClub);

                    await queryRunner.commitTransaction();

                    return hrFirstClub;
                }

                throw createGraphQLError('Hr first club not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

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
        deleteHrFirstClub: async (_: any, args: { input: { id: string } }, context: any): Promise<Payload> => {
            try {
                const hrFirstClub = await HrFirstClub.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: hrFirstClubRelations,
                });

                if (hrFirstClub) {
                    const user = context.req.session.user as User;

                    if (!user.admin && (!user.hrFirstClub || hrFirstClub?.id !== user.hrFirstClub.id)) {
                        throw createGraphQLError('Access denied for this hr first club', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    const result = await HrFirstClub.delete(args.input.id);

                    if (result.affected === 1) {
                        return { success: true };
                    }
                }

                throw createGraphQLError('Hr first club not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createTalent: async (_: any, args: { input: CreateTalentInput }): Promise<Talent> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const talent = Object.assign(new Talent(), { ...args.input, contact: undefined }) as Talent;

                const contact = Contact.create(args.input.contact);

                const address = Address.create(args.input.contact.address);
                await queryRunner.manager.save(address);
                contact.address = address;

                await queryRunner.manager.save(contact);

                talent.contact = contact;

                await queryRunner.manager.save(talent);

                const user = (await User.findOne({ where: { id: args.input.user.id } })) as User;

                user.validateAt = new Date();

                await queryRunner.manager.save(user);

                const { fileUrl, fileName, fileType } = await generateConsentForTalent(talent, user);
                const consent = Media.create({
                    fileUrl,
                    fileName,
                    fileType,
                });
                await queryRunner.manager.save(consent);

                talent.consent = consent;
                await queryRunner.manager.save(talent);

                await queryRunner.commitTransaction();

                return talent;
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
        updateTalent: async (_: any, args: { input: UpdateTalentInput }, context: any): Promise<Talent> => {
            const queryRunner = AppDataSource.createQueryRunner();

            const user = context.req.session.user as User;

            if (!user.admin && (!user.talent || args.input.id !== user.talent.id)) {
                throw createGraphQLError('Access denied for this talent', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
            }

            await queryRunner.startTransaction();

            try {
                let talent = await Talent.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: talentRelations,
                });

                if (!talent) {
                    throw createGraphQLError('Talent not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                }

                if (args.input.contact) {
                    if (talent?.contact) {
                        const contact = Object.assign(talent.contact, { ...args.input.contact, address: undefined }) as Contact;

                        if (args.input.contact.address) {
                            const address = talent.contact.address ? Object.assign(talent.contact.address, args.input.contact.address) : Address.create(args.input.contact.address);
                            await queryRunner.manager.save(address);
                            contact.address = address;
                        }

                        await queryRunner.manager.save(contact);
                    } else {
                        const address = Address.create(args.input.contact.address);
                        await queryRunner.manager.save(address);

                        const contact = Contact.create({ ...args.input.contact, address: undefined });
                        contact.address = address;
                        await queryRunner.manager.save(contact);

                        talent.contact = contact;
                        await queryRunner.manager.save(talent);
                    }
                }

                if (Array.isArray(args.input.skills)) {
                    const skills = args.input.skills.map((skill) => skill.id);

                    const skillsToUpdate = await Skill.findBy({ id: In(skills) });

                    // Update talent's skills
                    talent.skills = skillsToUpdate;
                    await queryRunner.manager.save(talent);
                }

                talent = Object.assign(talent, { ...args.input, contact: undefined, skills: undefined }) as Talent;
                await queryRunner.manager.save(talent);

                await queryRunner.commitTransaction();

                return talent;

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
        deleteTalent: async (_: any, args: { input: { id: string } }, context: any): Promise<Payload> => {
            try {
                const talent = await Talent.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: talentRelations,
                });

                if (talent) {
                    const user = context.req.session.user as User;

                    if (!user.admin && (!user.talent || talent?.id !== user.referral.id)) {
                        throw createGraphQLError('Access denied for this referral', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    const result = await Talent.delete(args.input.id);

                    if (result.affected === 1) {
                        return { success: true };
                    }
                }

                throw createGraphQLError('Talent not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createFreelance: async (_: any, args: { input: CreateFreelanceInput }): Promise<Freelance> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const freelance = Object.assign(new Freelance(), { ...args.input, contact: undefined }) as Freelance;

                const contact = Contact.create(args.input.contact);

                const address = Address.create(args.input.contact.address);
                await queryRunner.manager.save(address);
                contact.address = address;

                await queryRunner.manager.save(contact);

                freelance.contact = contact;

                await queryRunner.manager.save(freelance);

                const user = (await User.findOne({ where: { id: args.input.user.id } })) as User;

                user.validateAt = new Date();

                await queryRunner.manager.save(user);

                await queryRunner.commitTransaction();

                return freelance;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                await queryRunner.rollbackTransaction();
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateFreelance: async (_: any, args: { input: UpdateFreelanceInput }, context: any): Promise<Freelance> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const freelance = await Freelance.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: freelanceRelations,
                });

                if (freelance) {
                    const user = context.req.session.user as User;

                    if (!user.admin && (!user.freelance || freelance.id !== user.freelance.id)) {
                        throw createGraphQLError('Access denied for this freelance', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    if (args.input.contact) {
                        if (freelance.contact) {
                            if (args.input.contact.address) {
                                if (freelance.contact.address) {
                                    freelance.contact.address = Object.assign(freelance.contact.address, args.input.contact.address) as Address;
                                    await queryRunner.manager.save(freelance.contact.address);
                                } else {
                                    const address = Address.create(args.input.contact.address);
                                    await queryRunner.manager.save(address);

                                    freelance.contact.address = address;
                                }
                            }

                            freelance.contact = Object.assign(freelance.contact, { ...args.input.contact, address: undefined }) as Contact;
                            await queryRunner.manager.save(freelance.contact);
                        } else {
                            const contact = Contact.create(args.input.contact);

                            const address = Address.create(args.input.contact.address);
                            await queryRunner.manager.save(address);

                            contact.address = address;
                            await queryRunner.manager.save(contact);

                            freelance.contact = contact;
                            await queryRunner.manager.save(freelance);
                        }
                    }

                    Object.assign(freelance, { ...args.input, contact: undefined }) as Freelance;
                    await queryRunner.manager.save(freelance);

                    await queryRunner.commitTransaction();

                    return freelance;
                }

                throw createGraphQLError('Freelance not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                await queryRunner.rollbackTransaction();
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deleteFreelance: async (_: any, args: { input: { id: string } }, context: any): Promise<Payload> => {
            try {
                const freelance = await Freelance.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: freelanceRelations,
                });

                if (freelance) {
                    const user = context.req.session.user as User;

                    if (!user.admin && (!user.freelance || freelance?.id !== user.freelance.id)) {
                        throw createGraphQLError('Access denied for this freelance', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    const result = await Freelance.delete(args.input.id);

                    if (result.affected === 1) {
                        return { success: true };
                    }
                }

                throw createGraphQLError('Freelance not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createConsultant: async (_: any, args: { input: CreateConsultantInput }): Promise<Consultant> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const consultant = Object.assign(new Consultant(), { ...args.input, contact: undefined }) as Consultant;

                const contact = Contact.create(args.input.contact);

                const address = Address.create(args.input.contact.address);
                await queryRunner.manager.save(address);
                contact.address = address;

                await queryRunner.manager.save(contact);

                consultant.contact = contact;

                await queryRunner.manager.save(consultant);

                const user = (await User.findOne({ where: { id: args.input.user.id } })) as User;

                user.validateAt = new Date();

                await queryRunner.manager.save(user);

                await queryRunner.commitTransaction();

                return consultant;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                await queryRunner.rollbackTransaction();
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateConsultant: async (_: any, args: { input: UpdateConsultantInput }, context: any): Promise<Consultant> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const consultant = await Consultant.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: consultantRelations,
                });

                if (consultant) {
                    const user = context.req.session.user as User;

                    if (!user.admin && (!user.consultant || consultant.id !== user.consultant.id)) {
                        throw createGraphQLError('Access denied for this consultant', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    if (args.input.contact) {
                        if (consultant.contact) {
                            if (args.input.contact.address) {
                                if (consultant.contact.address) {
                                    consultant.contact.address = Object.assign(consultant.contact.address, args.input.contact.address) as Address;
                                    await queryRunner.manager.save(consultant.contact.address);
                                } else {
                                    const address = Address.create(args.input.contact.address);
                                    await queryRunner.manager.save(address);

                                    consultant.contact.address = address;
                                }
                            }

                            consultant.contact = Object.assign(consultant.contact, { ...args.input.contact, address: undefined }) as Contact;
                            await queryRunner.manager.save(consultant.contact);
                        } else {
                            const contact = Contact.create(args.input.contact);

                            const address = Address.create(args.input.contact.address);
                            await queryRunner.manager.save(address);

                            contact.address = address;
                            await queryRunner.manager.save(contact);

                            consultant.contact = contact;
                            await queryRunner.manager.save(consultant);
                        }
                    }

                    Object.assign(consultant, { ...args.input, contact: undefined }) as Consultant;
                    await queryRunner.manager.save(consultant);

                    await queryRunner.commitTransaction();

                    return consultant;
                }

                throw createGraphQLError('Consultant not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                await queryRunner.rollbackTransaction();
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deleteConsultant: async (_: any, args: { input: { id: string } }, context: any): Promise<Payload> => {
            try {
                const consultant = await Consultant.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: consultantRelations,
                });

                if (consultant) {
                    const user = context.req.session.user as User;

                    if (!user.admin && (!user.consultant || consultant?.id !== user.consultant.id)) {
                        throw createGraphQLError('Access denied for this consultant', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    const result = await Consultant.delete(args.input.id);

                    if (result.affected === 1) {
                        return { success: true };
                    }
                }

                throw createGraphQLError('Consultant not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createCV: async (_: any, args: { input: CreateCVInput }, context: any): Promise<CV> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const user = context.req.session.user as User;

                const cv = Object.assign(new CV(), args.input) as CV;

                cv.talent = user.talent;

                await queryRunner.manager.save(cv);

                await queryRunner.commitTransaction();

                return cv;
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
        uploadCV: async (_: any, args: { input: UploadCVInput }, context: any): Promise<CV> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const user = context.req.session.user as User;

                const cv = Object.assign(new CV(), args.input) as CV;

                cv.talent = user.talent;

                await queryRunner.manager.save(cv);

                await queryRunner.commitTransaction();

                return cv;
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
        updateCV: async (_: any, args: { input: UpdateCVInput }, context: any): Promise<CV> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                let cv = await CV.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: ['talent'],
                });

                if (cv) {
                    const user = context.req.session.user as User;

                    if (!user.admin && cv.talent.id !== user.talent.id) {
                        throw createGraphQLError('Access denied for this cv', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    cv = Object.assign(cv, args.input) as CV;

                    await queryRunner.manager.save(cv);

                    await queryRunner.commitTransaction();

                    return cv;
                }

                throw createGraphQLError('CV not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

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
        deleteCV: async (_: any, args: { input: { id: string } }, context: any): Promise<Payload> => {
            try {
                const cv = await CV.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: ['talent'],
                });

                if (cv) {
                    const user = context.req.session.user as User;

                    if (!user.admin && cv.talent.id !== user.talent.id) {
                        throw createGraphQLError('Access denied for this lm', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    const result = await CV.delete(args.input.id);

                    if (result.affected === 1) {
                        return { success: true };
                    }
                }

                throw createGraphQLError('CV not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createLM: async (_: any, args: { input: CreateLMInput }, context: any): Promise<LM> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const user = context.req.session.user as User;

                const lm = Object.assign(new LM(), args.input) as LM;

                lm.talent = user.talent;

                await queryRunner.manager.save(lm);

                await queryRunner.commitTransaction();

                return lm;
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
        updateLM: async (_: any, args: { input: UpdateLMInput }, context: any): Promise<LM> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                let lm = await LM.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: ['talent'],
                });

                if (lm) {
                    const user = context.req.session.user as User;

                    if (!user.admin && lm.talent.id !== user.talent.id) {
                        throw createGraphQLError('Access denied for this lm', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    lm = Object.assign(lm, args.input) as LM;
                    await queryRunner.manager.save(lm);

                    await queryRunner.commitTransaction();

                    return lm;
                }

                throw createGraphQLError('LM not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

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
        deleteLM: async (_: any, args: { input: { id: string } }, context: any): Promise<Payload> => {
            try {
                const lm = await LM.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: ['talent'],
                });

                if (lm) {
                    const user = context.req.session.user as User;

                    if (!user.admin && lm.talent.id !== user.talent.id) {
                        throw createGraphQLError('Access denied for this lm', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    const result = await LM.delete(args.input.id);

                    if (result.affected === 1) {
                        return { success: true };
                    }
                }

                throw createGraphQLError('LM not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resolversComposition: any = {
    'Query.getUsers': [guard(['admin'])],
    'Query.getOneUsers': [guard(['admin', 'talent', 'company', 'referral'])],
    'Query.getOneCompany': [guard(['admin', 'company'])],
    'Query.getReferrals': [guard(['admin'])],
    'Query.getOneReferral': [guard(['admin', 'referral'])],
    'Query.getHrFirstClubs': [guard(['admin'])],
    'Query.getOneHrFirstClub': [guard(['admin', 'hr-first-club'])],
    'Query.getTalents': [guard(['admin'])],
    'Query.getOneTalent': [guard(['admin', 'talent'])],
    'Query.getFreelances': [guard(['admin'])],
    'Query.getOneFreelance': [guard(['admin', 'freelance'])],
    'Query.getConsultants': [guard(['admin'])],
    'Query.getOneConsultant': [guard(['admin', 'consultant'])],
    'Query.getCVs': [guard(['talent', 'freelance', 'consultant', 'admin'])],
    'Query.getOneCV': [guard(['talent', 'admin'])],
    'Query.generateCV': [guard(['admin', 'talent', 'company', 'referral'])],
    'Query.getLMs': [guard(['talent', 'admin'])],
    'Query.getOneLM': [guard(['talent', 'admin'])],
    'Query.generateLM': [guard(['admin', 'talent', 'company', 'referral'])],
    'Mutation.createUser': [guard(['admin'])],
    'Mutation.updateUser': [guard(['admin', 'talent', 'company', 'referral'])],
    'Mutation.deleteUser': [guard(['admin', 'talent', 'company', 'referral'])],
    'Mutation.createCompany': [guard(['admin'])],
    'Mutation.updateCompany': [guard(['admin', 'company'])],
    'Mutation.deleteCompany': [guard(['admin', 'company'])],
    'Mutation.createReferral': [guard(['admin'])],
    'Mutation.updateReferral': [guard(['admin', 'referral'])],
    'Mutation.deleteReferral': [guard(['admin', 'referral'])],
    'Mutation.createHrFirstClub': [guard(['admin'])],
    'Mutation.updateHrFirstClub': [guard(['admin', 'hr-first-club'])],
    'Mutation.deleteHrFirstClub': [guard(['admin', 'hr-first-club'])],
    'Mutation.createTalent': [guard(['admin'])],
    'Mutation.updateTalent': [guard(['admin', 'talent'])],
    'Mutation.deleteTalent': [guard(['admin', 'talent'])],
    'Mutation.createFreelance': [guard(['admin'])],
    'Mutation.updateFreelance': [guard(['admin', 'freelance'])],
    'Mutation.deleteFreelance': [guard(['admin', 'freelance'])],
    'Mutation.createConsultant': [guard(['admin'])],
    'Mutation.updateConsultant': [guard(['admin', 'consultant'])],
    'Mutation.deleteConsultant': [guard(['admin', 'consultant'])],
    'Mutation.createCV': [guard(['talent', 'freelance', 'consultant'])],
    'Mutation.updateCV': [guard(['talent', 'admin'])],
    'Mutation.deleteCV': [guard(['talent', 'admin'])],
    'Mutation.createLM': [guard(['talent'])],
    'Mutation.updateLM': [guard(['talent', 'admin'])],
    'Mutation.deleteLM': [guard(['talent', 'admin'])],
};

export default composeResolvers(resolver, resolversComposition);
