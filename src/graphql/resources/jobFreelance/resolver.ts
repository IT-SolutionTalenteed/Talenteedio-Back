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

                // Filtrer uniquement les jobs avec status public et jobType Freelance
                const filters = {
                    where: {
                        status: 'public',
                        jobType: { id: freelanceJobType.id },
                    },
                };

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
