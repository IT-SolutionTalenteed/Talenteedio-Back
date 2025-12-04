import { Pricing } from '../../../database/entities/Pricing';
import { Consultant } from '../../../database/entities/Consultant';

export const pricingResolvers = {
  Query: {
    getPricings: async (_: any, { consultantId }: any) => {
      const [rows, count] = await Pricing.findAndCount({
        where: { consultant: { id: consultantId } },
        order: { createdAt: 'DESC' },
      });
      return { rows, count };
    },
    
    getOnePricing: async (_: any, { id }: any) => {
      return await Pricing.findOne({ where: { id }, relations: ['consultant'] });
    },
  },

  Mutation: {
    createPricing: async (_: any, { input }: any, context: any) => {
      const user = context.req.session.user;
      
      // If user is a consultant, they can only create pricing for themselves
      if (user.consultant && user.consultant.id !== input.consultantId) {
        throw new Error('You can only create pricing for yourself');
      }

      const consultant = await Consultant.findOne({ where: { id: input.consultantId } });
      if (!consultant) {
        throw new Error('Consultant not found');
      }

      const pricing = Pricing.create({
        title: input.title,
        description: input.description,
        price: input.price,
        unit: input.unit,
        consultant,
      });

      return await pricing.save();
    },

    updatePricing: async (_: any, { input }: any, context: any) => {
      const user = context.req.session.user;
      
      const pricing = await Pricing.findOne({ 
        where: { id: input.id },
        relations: ['consultant']
      });
      
      if (!pricing) {
        throw new Error('Pricing not found');
      }

      // If user is a consultant, they can only update their own pricing
      if (user.consultant && pricing.consultant.id !== user.consultant.id) {
        throw new Error('You can only update your own pricing');
      }

      if (input.title !== undefined) pricing.title = input.title;
      if (input.description !== undefined) pricing.description = input.description;
      if (input.price !== undefined) pricing.price = input.price;
      if (input.unit !== undefined) pricing.unit = input.unit;

      return await pricing.save();
    },

    deletePricing: async (_: any, { id }: any, context: any) => {
      const user = context.req.session.user;
      
      const pricing = await Pricing.findOne({ 
        where: { id },
        relations: ['consultant']
      });
      
      if (!pricing) {
        throw new Error('Pricing not found');
      }

      // If user is a consultant, they can only delete their own pricing
      if (user.consultant && pricing.consultant.id !== user.consultant.id) {
        throw new Error('You can only delete your own pricing');
      }

      await pricing.remove();
      return true;
    },
  },
};
