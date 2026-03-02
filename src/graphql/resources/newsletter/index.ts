import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { join } from 'path';

import resolver from './resolver';

const typeDefs = loadSchemaSync(join(__dirname, './schema.graphql'), {
    loaders: [new GraphQLFileLoader()],
});

export default makeExecutableSchema({
    typeDefs,
    resolvers: resolver,
});
