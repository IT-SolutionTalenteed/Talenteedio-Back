import path from 'path';

import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { composeResolvers } from '@graphql-tools/resolvers-composition';

import { companyPlanResolvers } from './resolver';
import guard from '../../middleware/graphql-guard';

const resolversComposition: any = {
    'Mutation.createCompanyPlan': [guard(['admin'])],
    'Mutation.updateCompanyPlan': [guard(['admin'])],
    'Mutation.deleteCompanyPlan': [guard(['admin'])],
};

export default makeExecutableSchema({
    resolvers: composeResolvers(companyPlanResolvers, resolversComposition),
    typeDefs: loadSchemaSync(path.join(__dirname, 'schema.graphql'), {
        loaders: [new GraphQLFileLoader()],
    }),
});
