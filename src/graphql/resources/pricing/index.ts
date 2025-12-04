import path from 'path';

import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { composeResolvers } from '@graphql-tools/resolvers-composition';

import { pricingResolvers } from './resolver';
import guard from '../../middleware/graphql-guard';

const resolversComposition: any = {
    'Mutation.createPricing': [guard(['admin', 'consultant'])],
    'Mutation.updatePricing': [guard(['admin', 'consultant'])],
    'Mutation.deletePricing': [guard(['admin', 'consultant'])],
};

export default makeExecutableSchema({
    resolvers: composeResolvers(pricingResolvers, resolversComposition),
    typeDefs: loadSchemaSync(path.join(__dirname, 'schema.graphql'), {
        loaders: [new GraphQLFileLoader()],
    }),
});
