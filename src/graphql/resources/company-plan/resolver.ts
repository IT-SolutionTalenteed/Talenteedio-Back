import { CompanyPlan } from '../../../database/entities';
import { getResources } from '../../../helpers/graphql';

export const companyPlanResolvers = {
    Query: {
        getCompanyPlans: async (_: any, args: any) => {
            const { input, filter } = args;
            const where: any = {};

            if (filter?.isActive !== undefined) {
                where.isActive = filter.isActive;
            }

            return await getResources(CompanyPlan, input, [], { where, order: { displayOrder: 'ASC' } });
        },

        getOneCompanyPlan: async (_: any, args: { id: string }) => {
            return await CompanyPlan.findOne({ where: { id: args.id } });
        },

        getActiveCompanyPlans: async () => {
            return await CompanyPlan.find({
                where: { isActive: true },
                order: { displayOrder: 'ASC' },
            });
        },
    },

    Mutation: {
        createCompanyPlan: async (_: any, args: { input: any }) => {
            const plan = CompanyPlan.create(args.input);
            await plan.save();
            return plan;
        },

        updateCompanyPlan: async (_: any, args: { input: any }) => {
            const { id, ...data } = args.input;
            await CompanyPlan.update(id, data);
            return await CompanyPlan.findOne({ where: { id } });
        },

        deleteCompanyPlan: async (_: any, args: { id: string }) => {
            await CompanyPlan.delete(args.id);
            return true;
        },
    },
};
