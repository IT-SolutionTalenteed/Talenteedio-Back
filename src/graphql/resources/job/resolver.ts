import { composeResolvers } from '@graphql-tools/resolvers-composition';
import { In, LessThan, Like, MoreThan, Not } from 'typeorm';
import { createGraphQLError } from 'graphql-yoga';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import graphqlGuard from '../../middleware/graphql-guard';
import companyGuard from '../../middleware/company-guard';

import { CreateJobInput, JobWithIsApplied, JobWithReferralLink, PaginationInput, Payload, Resource, UpdateJobInput, UpdateMultipleJobsInput } from '../../../type';

import { Application, Company, Job, STATUS, Skill, User, Admin, Referral, Value, CV } from '../../../database/entities';
import AppDataSource from '../../../database';
import { APPLICATION_STATUS } from '../../../database/entities/Application';

import { getResources, returnError } from '../../../helpers/graphql';
import { BAD_REQUEST, FORBIDDEN, NOT_FOUND } from '../../../helpers/error-constants';
import transporter from '../../../helpers/mailer';
import { matchCVWithJob } from '../../../helpers/ai/cv-matcher';

const relations = ['company.user', 'featuredImage', 'location.address', 'jobType', 'category', 'skills', 'values'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const encode = (obj: any) => Buffer.from(JSON.stringify(obj)).toString('base64');
const decode = (str: string) => JSON.parse(Buffer.from(str, 'base64').toString('ascii'));

const createReferralLink = (obj: { job_id: string; referral_id: string }) => {
    return new URL(path.join(process.env.FRONTEND_HOST as string, 'job', 'detail', encode(obj))).toString();
};

const resolver = {
    Query: {
        getJobs: async (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            _: any,
            args: {
                input: PaginationInput;
                filter: {
                    adminId: string;
                    companyId: string;
                    search: string;
                    status: string;
                    location: string;
                    category: string;
                    salaryMin: number;
                    salaryMax: number;
                    experienceLevels: number;
                    jobTypes: string[];
                    datePosted: number;
                    isFeatured: boolean;
                };
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            context: any
        ): Promise<Resource<Job>> => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let filters: any;

                const user = context.req?.session?.user as User;

                if (args.filter) {
                    filters = args.filter.search ? { where: { title: Like(`%${args.filter.search}%`) } } : { where: {} };

                    if (!user?.admin) {
                        filters.where.status = 'public';
                    } else if (args.filter.status) {
                        filters.where.status = args.filter.status;
                    }

                    if (args.filter.location) filters.where.location = { id: args.filter.location };
                    if (args.filter.category) filters.where.category = { id: args.filter.category };
                    if (args.filter.salaryMin) filters.where.salaryMin = MoreThan(args.filter.salaryMin);
                    if (args.filter.salaryMax) filters.where.salaryMax = LessThan(args.filter.salaryMax);
                    if (args.filter.experienceLevels) filters.where.experience = MoreThan(args.filter.experienceLevels);
                    if (args.filter.jobTypes?.length) filters.where.jobType = { id: In(args.filter.jobTypes) };
                    if (args.filter.datePosted) {
                        const currentTime = new Date();
                        const lastTime = new Date(currentTime.getTime() - args.filter.datePosted * 3600 * 1000);
                        filters.where.createdAt = MoreThan(lastTime);
                    }

                    if (user && (user.admin || user.company)) {
                        if (args.filter.adminId) filters.where.admin = { id: args.filter.adminId };
                        else if (args.filter.companyId) filters.where.company = { id: args.filter.companyId };
                    }

                    if (user && !user.talent && args.filter.isFeatured) {
                        filters.where.isFeatured = args.filter.isFeatured;
                    } else if (!user || user?.talent) {
                        filters.where.isFeatured = false;
                    }
                } else if (!user?.admin) {
                    filters = { where: { status: 'public', isFeatured: false } };
                }

                const res = await getResources(Job, args.input, relations, filters);

                return res;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOneJob: async (_: any, args: { input: { id: string; slug: string } }, context: any): Promise<Job | JobWithReferralLink | JobWithIsApplied> => {
            try {
                if (!args.input.id && !args.input.slug) throw createGraphQLError('Input id or slug required', { extensions: { statusCode: 400, statusText: BAD_REQUEST } });

                let job = await Job.findOne({
                    where: [
                        { id: args.input.id }, //
                        { id: args.input.slug },
                        { slug: args.input.slug },
                    ],
                    relations: relations,
                });

                const user = context.req?.session?.user as User;

                if (!job && args.input.slug) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let data: any;

                    try {
                        data = decode(args.input.slug);
                    } catch (error) {
                        data = undefined;
                    }

                    if (data) {
                        job = await Job.findOne({
                            where: {
                                id: data.job_id,
                            },
                            relations: relations,
                        });
                    }
                }

                if (job) {
                    if (user && user.referral?.id && job.isSharable) {
                        return { ...job, referralLink: createReferralLink({ job_id: job.id, referral_id: user.referral?.id }) } as JobWithReferralLink;
                    } else if (user && user.talent?.id) {
                        const hasApplied = (await Application.findOne({
                            where: {
                                job: { id: job.id },
                                talent: { id: user.talent?.id },
                            },
                        }))
                            ? true
                            : false;

                        return { ...job, hasApplied } as JobWithIsApplied;
                    } else return job;
                }

                throw createGraphQLError('Job not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getApplications: async (_: any, args: { input: PaginationInput; filter: { status: string; jobId: string } }, context: any): Promise<Resource<Application>> => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const filters: any = { where: {} };

                const user = context.req.session?.user as User;

                if (args.filter?.status && (!user?.company || (args.filter?.status !== 'in_review' && args.filter?.status !== 'denied'))) {
                    filters.where.status = args.filter.status;
                } else if (user?.company || user?.admin) {
                    filters.where.status = Not(In(['in_review', 'denied']));
                }

                if (user?.talent) {
                    filters.where.talent = { id: user.talent.id };
                } else if (user?.referral) {
                    filters.where.referral = { id: user.referral.id };
                } else {
                    if (user?.company) {
                        if (args.filter?.jobId) {
                            const job = await Job.findOne({ where: { id: args.filter?.jobId, company: { id: user.company.id } } });

                            if (!job) throw createGraphQLError('Access denied for these applications', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                        }

                        filters.where.job = { company: { id: user.company.id } };
                    }

                    if (args.filter?.jobId) {
                        filters.where.job = filters.where.job ? { ...filters.where.job, id: args.filter?.jobId } : { id: args.filter?.jobId };
                    }
                }

                const res = await getResources(Application, args.input, ['job.company.contact', 'talent.user', 'referral.user', 'talent.contact', 'referral.contact'], filters);

                return res;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getOneApplication: async (_: any, args: { input: { id: string } }, context: any): Promise<Application> => {
            try {
                const application = await Application.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: ['job.company.contact', 'talent.user', 'referral.user', 'talent.contact', 'referral.contact', 'cv.file', 'lm'],
                });

                if (application) {
                    const user = context.req?.session?.user as User;

                    if ((user.talent && application.talent.id !== user.talent.id) || (user.referral && application.referral.id !== user.referral.id) || (user.company && application.job.company.id !== user.company.id)) {
                        throw createGraphQLError('Access denied for this application', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    return application;
                }

                throw createGraphQLError('Application not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        matchCVWithJob: async (_: any, args: { input: { cvId: string; jobId: string } }, context: any): Promise<any> => {
            try {
                const user = context.req?.session?.user as User;

                if (!user?.talent) {
                    throw createGraphQLError('Only talents can match their CV with jobs', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                }

                // Get the job details
                const job = await Job.findOne({
                    where: { id: args.input.jobId },
                    relations: ['skills', 'category', 'jobType', 'location'],
                });

                if (!job) {
                    throw createGraphQLError('Job not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                }

                // Get the CV details
                const cv = await CV.findOne({
                    where: { id: args.input.cvId, talent: { id: user.talent.id } },
                    relations: ['file', 'talent'],
                });

                if (!cv) {
                    throw createGraphQLError('CV not found or access denied', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                }

                // Extract CV text (you'll need to implement this based on your file storage)
                // For now, we'll use a placeholder
                const cvText = cv.file?.fileUrl || 'CV content not available';
                
                // TODO: Implement actual CV text extraction from file URL
                // You might want to use pdf-parse, mammoth, or similar libraries
                
                // Prepare job data
                const jobSkills = job.skills?.map(skill => skill.name) || [];
                const jobRequirements = `Category: ${job.category?.name || 'N/A'}, Type: ${job.jobType?.name || 'N/A'}, Location: ${job.location?.name || 'N/A'}`;

                // Call AI matching service
                const matchResult = await matchCVWithJob({
                    cvText,
                    jobTitle: job.title,
                    jobDescription: job.content,
                    jobRequirements,
                    jobSkills,
                    experienceRequired: job.experience || 0,
                });

                return matchResult;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getCVTransmissionLogs: async (_: any, args: { applicationId: string }): Promise<any[]> => {
            try {
                const { TransmissionLogService } = await import('../../../helpers/transmission-log');
                return await TransmissionLogService.getLogsForApplication(args.applicationId);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getApplicationFeedbacks: async (_: any, args: { applicationId: string }): Promise<any[]> => {
            try {
                const { ApplicationFeedback } = await import('../../../database/entities');
                return await ApplicationFeedback.find({
                    where: { application: { id: args.applicationId } },
                    order: { createdAt: 'DESC' },
                });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },
    Mutation: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createJob: async (_: any, args: { input: CreateJobInput }, context: any): Promise<Job> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const user = context.req.session.user as User;

                if (user.company) {
                    args.input.company = { id: user.company.id };
                } else {
                    const companyId = (await Company.findOne({ where: { id: args.input.company.id } }))?.id;

                    if (!companyId) throw createGraphQLError('Company not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                }

                const job = Object.assign(new Job(), args.input);
                await queryRunner.manager.save(job);

                await queryRunner.commitTransaction();

                return job;
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
        updateJob: async (_: any, args: { input: UpdateJobInput }, context: any): Promise<Job> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const job = await Job.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: relations,
                });

                if (job) {
                    const user = context.req.session.user as User;

                    if (user.company) {
                        if (job.company?.id !== user.company.id) {
                            throw createGraphQLError('Access denied for this article', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                        }

                        if (user.company.permission.validityPeriodOfAJob >= 0) {
                            args.input.expirationDate = undefined;
                        }
                    }

                    if (Array.isArray(args.input.skills)) {
                        const skills = args.input.skills.map((skill) => skill.id);

                        const skillsToUpdate = await Skill.findBy({ id: In(skills) });

                        // Update the job's skills
                        job.skills = skillsToUpdate;
                        await queryRunner.manager.save(job);
                    }

                    if (Array.isArray(args.input.values)) {
                        const values = args.input.values.map((value) => value.id);

                        const valuesToUpdate = await Value.findBy({ id: In(values) });

                        // Update the job's values
                        job.values = valuesToUpdate;
                        await queryRunner.manager.save(job);
                    }

                    const updatedJob = Object.assign(job, { ...args.input, skills: undefined });
                    await queryRunner.manager.save(job);

                    await queryRunner.commitTransaction();

                    return updatedJob;
                }

                throw createGraphQLError('Job not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });

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
        changeJobStatus: async (_: any, args: { input: { id: string; status: STATUS } }): Promise<Job> => {
            try {
                const job = await Job.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: relations,
                });

                if (job) {
                    job.status = args.input.status;
                    await job.save();
                    return job;
                }

                throw createGraphQLError('Location not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deleteJob: async (_: any, args: { input: { id: string } }, context: any): Promise<{ success: boolean }> => {
            try {
                const job = await Job.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: relations,
                });

                if (job) {
                    const user = context.req.session.user as User;

                    if (user.company && job.company?.id !== user.company.id) {
                        throw createGraphQLError('Access denied for this article', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    const result = await Job.delete(args.input.id);

                    if (result.affected === 1) {
                        return { success: true };
                    }
                }

                throw createGraphQLError('Job not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        applyForJob: async (_: any, args: { input: { jobId: string; lmId: string; cvId: string } }, context: any): Promise<{ success: boolean }> => {
            const queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.startTransaction();

            try {
                const user = (await User.findOne({ where: { id: context.req.session.user?.id }, relations: ['talent.applications.job'] })) as User;

                const job = await Job.findOne({
                    where: [
                        { id: args.input.jobId },
                        { slug: args.input.jobId }, //
                    ],
                    relations: relations,
                });

                if (job) {
                    if (user.talent.applications?.filter((e) => e.job.id === job.id)?.length) {
                        throw createGraphQLError('You already applied for this job', { extensions: { statusCode: 400, statusText: BAD_REQUEST } });
                    }

                    if (user.talent.applications?.length && user.talent.applications?.length >= 3) {
                        throw createGraphQLError('You can applied for 5 jobs', { extensions: { statusCode: 400, statusText: BAD_REQUEST } });
                    }

                    // Check if there's a profile match result for this CV and Job
                    let profileMatchResult = null;
                    if (args.input.cvId) {
                        const { ProfileMatchResult } = await import('../../../database/entities/ProfileMatchResult');
                        profileMatchResult = await ProfileMatchResult.findOne({
                            where: { cvId: args.input.cvId, jobId: job.id },
                        });
                    }

                    const application = Object.assign(new Application(), {
                        job: { id: job.id },
                        talent: { id: user.talent.id },
                        cv: args.input.cvId ? { id: args.input.cvId } : undefined,
                        lm: args.input.lmId ? { id: args.input.lmId } : undefined,
                        profileMatchResult: profileMatchResult ? { id: profileMatchResult.id } : undefined,
                    });

                    await Application.save(application);

                    // Déclencher le traitement automatique basé sur le score de matching
                    if (profileMatchResult) {
                        const { ApplicationProcessingService } = await import('../../../helpers/application-processing');
                        try {
                            await ApplicationProcessingService.processApplication(application.id);
                            // Le workflow automatique gère tous les emails
                            return { success: true };
                        } catch (error) {
                            console.error('Error in automatic processing:', error);
                            // En cas d'erreur, continuer avec le flow normal
                        }
                    }

                    // Load CV with file to get URL
                    const cvEntity = args.input.cvId ? await CV.findOne({ where: { id: args.input.cvId }, relations: ['file'] }) : null;
                    const { LM } = await import('../../../database/entities');
                    const lmEntity = args.input.lmId ? await LM.findOne({ where: { id: args.input.lmId } }) : null;

                    const admins = await Admin.find({ where: {}, relations: ['user'] });

                    // Prepare match report for admin email
                    let matchReportHtml = '';
                    if (profileMatchResult) {
                        const pythonData = profileMatchResult.pythonReturn;
                        matchReportHtml = `
                            <h3>📊 Rapport de Matching de Profil</h3>
                            <p><strong>Score global:</strong> ${pythonData?.matchPercentage || 'N/A'}%</p>
                            <p><strong>Synthèse:</strong> ${pythonData?.synthesis || 'N/A'}</p>
                            <p><strong>Interprétation:</strong> ${pythonData?.interpretation || 'N/A'}</p>
                            <p><strong>Recommandations:</strong> ${pythonData?.recommendations || 'N/A'}</p>
                            <hr/>
                        `;
                    }

                    // Prepare CV and LM info
                    const cvLink = cvEntity?.file?.fileUrl ? new URL(path.join(process.env.HOST as string, cvEntity.file.fileUrl)).toString() : null;
                    const cvHtml = cvLink ? `<p><strong>📄 CV:</strong> <a href="${cvLink}">Télécharger le CV</a></p>` : '<p><strong>📄 CV:</strong> Non fourni</p>';
                    const lmHtml = lmEntity ? `<p><strong>✉️ Lettre de motivation:</strong> ${lmEntity.title}</p>` : '<p><strong>✉️ Lettre de motivation:</strong> Non fournie</p>';

                    await Promise.allSettled([
                        transporter.sendMail({
                            from: 'Talenteed.io ' + process.env.MAILUSER,
                            to: user.email,
                            subject: 'Application for ' + job.title,
                            template: 'index',
                            context: {
                                title: `Hi ${user.name}`,
                                message: `We have received your application for this job. Please, check the details of your application here: ${new URL(path.join(process.env.FRONTEND_HOST as string, 'admin', 'application', application.id)).toString()}`,
                                host: process.env.FRONTEND_HOST,
                                imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                                imageTitle: 'Talent application',
                                backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
                            },
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        } as any),

                        ...admins.map((admin) => {
                            return transporter.sendMail({
                                from: 'Talenteed.io ' + process.env.MAILUSER,
                                to: admin.user?.email,
                                subject: 'Application for ' + job.title,
                                template: 'index',
                                context: {
                                    title: `Hi ${admin.user?.name}`,
                                    message: `A new job application must be reviewed here: ${new URL(path.join(process.env.FRONTEND_HOST as string, 'admin', 'application-in-review', application.id)).toString()}
                                    <br/><br/>
                                    ${matchReportHtml}
                                    ${cvHtml}
                                    ${lmHtml}
                                    `,
                                    host: process.env.FRONTEND_HOST,
                                    imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                                    imageTitle: 'Talent application',
                                    backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
                                },
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            } as any);
                        }),
                    ]);

                    return { success: true };
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let data: any;

                try {
                    data = decode(args.input.jobId);
                } catch (error) {
                    data = undefined;
                }

                if (data) {
                    const job = await Job.findOne({
                        where: {
                            id: data.job_id,
                        },
                        relations: relations,
                    });

                    if (job) {
                        if (user.talent.applications?.filter((e) => e.job.id === job.id)?.length) {
                            throw createGraphQLError('You already apply for this job', { extensions: { statusCode: 400, statusText: BAD_REQUEST } });
                        }

                        const referral = await Referral.findOne({ where: { id: data.referral_id }, relations: ['user'] });

                        if (!referral) {
                            throw createGraphQLError('Referral not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                        }

                        // Check if there's a profile match result for this CV and Job
                        let profileMatchResult = null;
                        if (args.input.cvId) {
                            const { ProfileMatchResult } = await import('../../../database/entities/ProfileMatchResult');
                            profileMatchResult = await ProfileMatchResult.findOne({
                                where: { cvId: args.input.cvId, jobId: job.id },
                            });
                        }

                        const application = Object.assign(new Application(), {
                            job: { id: job.id },
                            talent: { id: user.talent.id },
                            referral: { id: data.referral_id },
                            cv: args.input.cvId ? { id: args.input.cvId } : undefined,
                            lm: args.input.lmId ? { id: args.input.lmId } : undefined,
                            profileMatchResult: profileMatchResult ? { id: profileMatchResult.id } : undefined,
                        });

                        await Application.save(application);

                        // Déclencher le traitement automatique basé sur le score de matching
                        if (profileMatchResult) {
                            const { ApplicationProcessingService } = await import('../../../helpers/application-processing');
                            try {
                                await ApplicationProcessingService.processApplication(application.id);
                                // Le workflow automatique gère tous les emails
                                return { success: true };
                            } catch (error) {
                                console.error('Error in automatic processing:', error);
                                // En cas d'erreur, continuer avec le flow normal
                            }
                        }

                        // Load CV with file to get URL
                        const cvEntity = args.input.cvId ? await CV.findOne({ where: { id: args.input.cvId }, relations: ['file'] }) : null;
                        const { LM } = await import('../../../database/entities');
                        const lmEntity = args.input.lmId ? await LM.findOne({ where: { id: args.input.lmId } }) : null;

                        const admins = await Admin.find({ where: {}, relations: ['user'] });

                        // Prepare match report for admin email
                        let matchReportHtml = '';
                        if (profileMatchResult) {
                            const pythonData = profileMatchResult.pythonReturn;
                            matchReportHtml = `
                                <h3>📊 Rapport de Matching de Profil</h3>
                                <p><strong>Score global:</strong> ${pythonData?.matchPercentage || 'N/A'}%</p>
                                <p><strong>Synthèse:</strong> ${pythonData?.synthesis || 'N/A'}</p>
                                <p><strong>Interprétation:</strong> ${pythonData?.interpretation || 'N/A'}</p>
                                <p><strong>Recommandations:</strong> ${pythonData?.recommendations || 'N/A'}</p>
                                <hr/>
                            `;
                        }

                        // Prepare CV and LM info
                        const cvLink = cvEntity?.file?.fileUrl ? new URL(path.join(process.env.HOST as string, cvEntity.file.fileUrl)).toString() : null;
                        const cvHtml = cvLink ? `<p><strong>📄 CV:</strong> <a href="${cvLink}">Télécharger le CV</a></p>` : '<p><strong>📄 CV:</strong> Non fourni</p>';
                        const lmHtml = lmEntity ? `<p><strong>✉️ Lettre de motivation:</strong> ${lmEntity.title}</p>` : '<p><strong>✉️ Lettre de motivation:</strong> Non fournie</p>';

                        await Promise.allSettled([
                            transporter.sendMail({
                                from: 'Talenteed.io ' + process.env.MAILUSER,
                                to: user.email,
                                subject: 'Application for ' + job.title,
                                template: 'index',
                                context: {
                                    title: `Hi ${user.name}`,
                                    message: `We have received your application for this job. Please, check the details of your application here: ${new URL(path.join(process.env.FRONTEND_HOST as string, 'admin', 'application', application.id)).toString()}`,
                                    host: process.env.FRONTEND_HOST,
                                    imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                                    imageTitle: 'Talent application',
                                    backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
                                },
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            } as any),

                            transporter.sendMail({
                                from: 'Talenteed.io ' + process.env.MAILUSER,
                                to: referral.user.email,
                                subject: 'Application for ' + job.title,
                                template: 'index',
                                context: {
                                    title: `Hi ${referral.user.name}`,
                                    message: `We have received an application for this job that you have recommended. Please, check the details here: ${new URL(path.join(process.env.FRONTEND_HOST as string, 'admin', 'application', application.id)).toString()}`,
                                    host: process.env.FRONTEND_HOST,
                                    imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                                    imageTitle: 'Talent application',
                                    backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
                                },
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            } as any),

                            ...admins.map((admin) => {
                                return transporter.sendMail({
                                    from: 'Talenteed.io ' + process.env.MAILUSER,
                                    to: admin.user?.email,
                                    subject: 'Application for ' + job.title,
                                    template: 'index',
                                    context: {
                                        title: `Hi ${admin.user?.name}`,
                                        message: `A new job application must be reviewed here: ${new URL(path.join(process.env.FRONTEND_HOST as string, 'admin', 'application-in-review', application.id)).toString()}
                                        <br/><br/>
                                        ${matchReportHtml}
                                        ${cvHtml}
                                        ${lmHtml}
                                        `,
                                        host: process.env.FRONTEND_HOST,
                                        imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                                        imageTitle: 'Talent application',
                                        backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
                                    },
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                } as any);
                            }),
                        ]);

                        return { success: true };
                    }
                }

                throw createGraphQLError('Job not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deleteApplication: async (_: any, args: { input: { id: string } }, context: any): Promise<{ success: boolean }> => {
            try {
                const application = await Application.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: ['talent.user', 'referral.user', 'job'],
                });

                if (application) {
                    const user = context.req.session.user as User;

                    if (user.talent && application.talent?.id !== user.talent.id) {
                        throw createGraphQLError('Access denied for this application', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    const result = await Application.delete(args.input.id);

                    await Promise.allSettled([
                        transporter.sendMail({
                            from: 'Talenteed.io ' + process.env.MAILUSER,
                            to: application.talent.user.email,
                            subject: 'Application for ' + application.job.title + ' deleted',
                            template: 'index',
                            context: {
                                title: `Hi ${application.talent.user.name}`,
                                message: `Your application has been deleted`,
                                host: process.env.FRONTEND_HOST,
                                imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                                imageTitle: 'Application deleted',
                                backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
                            },
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        } as any),

                        ...(application.referral
                            ? [
                                  transporter.sendMail({
                                      from: 'Talenteed.io ' + process.env.MAILUSER,
                                      to: application.referral.user.email,
                                      subject: 'Application for ' + application.job.title + ' deleted',
                                      template: 'index',
                                      context: {
                                          title: `Hi ${application.referral.user.name}`,
                                          message: `Application you referred has been deleted`,
                                          host: process.env.FRONTEND_HOST,
                                          imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                                          imageTitle: 'Application deleted',
                                          backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
                                      },
                                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  } as any),
                              ]
                            : []),
                    ]);

                    if (result.affected === 1) {
                        return { success: true };
                    }
                }

                throw createGraphQLError('Application not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        changeApplicationStatus: async (_: any, args: { input: { id: string; status: APPLICATION_STATUS; rejection_reason?: string } }, context: any): Promise<Payload> => {
            try {
                const application = await Application.findOne({
                    where: {
                        id: args.input.id,
                    },
                    relations: ['job.company.contact', 'talent.user', 'referral.user'],
                });

                if (application) {
                    const user = context.req.session.user as User;

                    if (user.company && application.job.company.id !== user.company.id) {
                        throw createGraphQLError('Access denied for this application', { extensions: { statusCode: 403, statusText: FORBIDDEN } });
                    }

                    if (args.input.status === 'denied') {
                        await Application.delete(application.id);

                        await Promise.allSettled([
                            transporter.sendMail({
                                from: 'Talenteed.io ' + process.env.MAILUSER,
                                to: application.talent.user.email,
                                subject: 'Application for ' + application.job.title + ' updated',
                                template: 'index',
                                context: {
                                    title: `Hi ${application.talent.user.name}`,
                                    message: `
                                        Your application has been denied.
                                        ${args.input.status === 'denied' && args.input.rejection_reason ? `<br/><br/>Reason for rejection: ${args.input.rejection_reason}` : ''}
                                        <br/><br/> Please reapply with correct information.
                                    `,
                                    host: process.env.FRONTEND_HOST,
                                    imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                                    imageTitle: 'Application denied',
                                    backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
                                },
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            } as any),

                            ...(application.referral
                                ? [
                                      transporter.sendMail({
                                          from: 'Talenteed.io ' + process.env.MAILUSER,
                                          to: application.referral.user.email,
                                          subject: 'Application for ' + application.job.title + ' updated',
                                          template: 'index',
                                          context: {
                                              title: `Hi ${application.referral.user.name}`,
                                              message: `
                                                The application of talent: ${application.talent.user.email} you recommended has been denied.
                                                ${args.input.status === 'denied' && args.input.rejection_reason ? `<br/><br/>Reason for rejection: ${args.input.rejection_reason}` : ''}
                                                <br/><br/> Please tell the talent to reapply with correct information.
                                              `,
                                              host: process.env.FRONTEND_HOST,
                                              imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                                              imageTitle: 'Application denied',
                                              backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
                                          },
                                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                      } as any),
                                  ]
                                : []),
                        ]);
                    } else {
                        application.status = args.input.status;
                        await application.save();

                        const admins = await Admin.find({ where: {}, relations: ['user'] });

                        await Promise.allSettled([
                            transporter.sendMail({
                                from: 'Talenteed.io ' + process.env.MAILUSER,
                                to: application.talent.user.email,
                                subject: 'Application for ' + application.job.title + ' updated',
                                template: 'index',
                                context: {
                                    title: `Hi ${application.talent.user.name}`,
                                    message: `
                                        The status of your application has been updated. Please, check the details here: ${new URL(path.join(process.env.FRONTEND_HOST as string, 'admin', 'application', application.id)).toString()}
                                    `,
                                    host: process.env.FRONTEND_HOST,
                                    imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                                    imageTitle: 'Application status',
                                    backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
                                },
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            } as any),

                            ...(application.referral
                                ? [
                                      transporter.sendMail({
                                          from: 'Talenteed.io ' + process.env.MAILUSER,
                                          to: application.referral.user.email,
                                          subject: 'Application for ' + application.job.title + ' updated',
                                          template: 'index',
                                          context: {
                                              title: `Hi ${application.referral.user.name}`,
                                              message: `
                                                The status of the application you recommended has been updated. Please, check the details here: ${new URL(path.join(process.env.FRONTEND_HOST as string, 'admin', 'application', application.id)).toString()}
                                              `,
                                              host: process.env.FRONTEND_HOST,
                                              imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                                              imageTitle: 'Application status',
                                              backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
                                          },
                                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                      } as any),
                                  ]
                                : []),

                            ...(user.admin
                                ? []
                                : admins.map((admin) => {
                                      return transporter.sendMail({
                                          from: 'Talenteed.io ' + process.env.MAILUSER,
                                          to: admin.user?.email,
                                          subject: 'Application for ' + application.job.title + ' updated',
                                          template: 'index',
                                          context: {
                                              title: `Hi ${admin.user?.name}`,
                                              message: `There is an application update. Please, check the details here: ${new URL(path.join(process.env.FRONTEND_HOST as string, 'admin', 'job', application.job.id, 'application', application.id)).toString()}`,
                                              host: process.env.FRONTEND_HOST,
                                              imgUrl: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'main-150.png')).toString(),
                                              imageTitle: 'Application status',
                                              backgroundImg: new URL(path.join(process.env.HOST as string, 'public', 'assets', 'img', 'diversity-home.jpg')).toString(),
                                          },
                                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                      } as any);
                                  })),
                        ]);
                    }

                    return { success: true };
                }

                throw createGraphQLError('Location not found', { extensions: { statusCode: 404, statusText: NOT_FOUND } });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateMultipleJobs: async (_: any, args: { input: UpdateMultipleJobsInput }): Promise<Payload> => {
            try {
                const queryBuilder = Job.createQueryBuilder().update(Job).set({ expirationDate: args.input.expirationDate });

                if (args.input.includedIds?.length) {
                    queryBuilder.where('id IN (:...includedIds)', { includedIds: args.input.includedIds });
                }

                if (args.input.excludedIds?.length) {
                    queryBuilder.andWhere('id NOT IN (:...excludedIds)', { excludedIds: args.input.excludedIds });
                }

                await queryBuilder.execute();

                return { success: true };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validatePendingApplication: async (_: any, args: { input: { applicationId: string; approved: boolean; adminNote?: string } }): Promise<Payload> => {
            try {
                const { ApplicationProcessingService } = await import('../../../helpers/application-processing');
                await ApplicationProcessingService.validatePendingApplication(args.input.applicationId, args.input.approved, args.input.adminNote);
                return { success: true };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sendConsultantContract: async (_: any, args: { input: { applicationId: string; contractUrl: string } }): Promise<Payload> => {
            try {
                const { ApplicationProcessingService } = await import('../../../helpers/application-processing');
                await ApplicationProcessingService.sendConsultantContract(args.input.applicationId, args.input.contractUrl);
                return { success: true };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        submitApplicationFeedback: async (_: any, args: { input: { applicationId: string; matchScoreAccuracy?: number; comments?: string; criteriaFeedback?: string; wasHired: boolean } }, context: any): Promise<Payload> => {
            try {
                const user = context.req.session.user as User;
                const { ApplicationFeedback, REVIEWER_TYPE } = await import('../../../database/entities/ApplicationFeedback');

                const feedback = ApplicationFeedback.create({
                    application: { id: args.input.applicationId } as Application,
                    reviewedBy: user.id,
                    reviewerType: user.admin ? REVIEWER_TYPE.ADMIN : REVIEWER_TYPE.CLIENT,
                    matchScoreAccuracy: args.input.matchScoreAccuracy,
                    comments: args.input.comments,
                    criteriaFeedback: args.input.criteriaFeedback ? JSON.parse(args.input.criteriaFeedback) : null,
                    wasHired: args.input.wasHired,
                });

                await feedback.save();
                return { success: true };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },
};

const resolversComposition = {
    // getJobs doit être accessible publiquement; le resolver filtre déjà sur status 'public' pour les non-admins
    // getOneJob doit être accessible publiquement; le resolver gère les champs dépendants de l'utilisateur connecté
    'Query.getApplications': [graphqlGuard(['admin', 'talent', 'referral', 'company'])],
    'Query.getOneApplication': [graphqlGuard(['admin', 'talent', 'company'])],
    'Query.matchCVWithJob': [graphqlGuard(['talent'])],
    'Mutation.createJob': [graphqlGuard(['admin', 'company']), companyGuard('job')],
    'Mutation.updateJob': [graphqlGuard(['admin', 'company'])],
    'Mutation.deleteJob': [graphqlGuard(['admin', 'company'])],
    'Mutation.changeJobStatus': [graphqlGuard(['admin', 'company'])],
    'Mutation.applyForJob': [graphqlGuard(['talent'])],
    'Mutation.deleteApplication': [graphqlGuard(['admin', 'talent'])],
    'Mutation.changeApplicationStatus': [graphqlGuard(['admin', 'company'])],
    'Mutation.updateMultipleJobs': [graphqlGuard(['admin'])],
    'Mutation.validatePendingApplication': [graphqlGuard(['admin'])],
    'Mutation.sendConsultantContract': [graphqlGuard(['admin'])],
    'Mutation.submitApplicationFeedback': [graphqlGuard(['admin', 'company'])],
    'Query.getCVTransmissionLogs': [graphqlGuard(['admin'])],
    'Query.getApplicationFeedbacks': [graphqlGuard(['admin', 'company'])],
};

export default composeResolvers(resolver, resolversComposition);
