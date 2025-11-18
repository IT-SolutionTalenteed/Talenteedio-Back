import { Like, LessThan, MoreThan } from 'typeorm';
import { PaginationInput, Resource } from '../../../type';
import { Job, JobType } from '../../../database/entities';
import { getResources, returnError } from '../../../helpers/graphql';

const relations = ['featuredImage', 'location', 'jobType', 'category'];

const resolver = {
    Query: {
        getFreelanceJobs: async (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            _: any,
            args: {
                input: PaginationInput;
                filter: {
                    search: string;
                    location: string;
                    category: string;
                    salaryMin: number;
                    salaryMax: number;
                    experienceLevels: number;
                    jobTypes: string[];
                    datePosted: number;
                    isFeatured: boolean;
                };
            }
        ): Promise<Resource<Job>> => {
            try {
                // Récupérer le JobType "Freelance"
                const freelanceJobType = await JobType.findOne({
                    where: { name: 'Freelance' },
                });

                if (!freelanceJobType) {
                    return {
                        rows: [],
                        total: 0,
                        page: args.input?.page || 1,
                        limit: args.input?.limit || 10,
                    };
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let filters: any;

                if (args.filter) {
                    filters = args.filter.search ? { where: { title: Like(`%${args.filter.search}%`) } } : { where: {} };

                    // Toujours filtrer par status public et jobType Freelance
                    filters.where.status = 'public';
                    filters.where.jobType = { id: freelanceJobType.id };

                    if (args.filter.location) filters.where.location = { id: args.filter.location };
                    if (args.filter.category) filters.where.category = { id: args.filter.category };
                    if (args.filter.salaryMin) filters.where.salaryMin = MoreThan(args.filter.salaryMin);
                    if (args.filter.salaryMax) filters.where.salaryMax = LessThan(args.filter.salaryMax);
                    if (args.filter.experienceLevels) filters.where.experience = MoreThan(args.filter.experienceLevels);
                    if (args.filter.datePosted) {
                        const currentTime = new Date();
                        const lastTime = new Date(currentTime.getTime() - args.filter.datePosted * 3600 * 1000);
                        filters.where.createdAt = MoreThan(lastTime);
                    }
                    if (args.filter.isFeatured !== undefined) {
                        filters.where.isFeatured = args.filter.isFeatured;
                    }
                } else {
                    // Filtrer uniquement les jobs avec status public et jobType Freelance
                    filters = {
                        where: {
                            status: 'public',
                            jobType: { id: freelanceJobType.id },
                        },
                    };
                }

                const res = await getResources(Job, args.input, relations, filters);

                return res;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw returnError(error);
            }
        },
    },
};

export default resolver;
