import path from 'path';

import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { makeExecutableSchema } from '@graphql-tools/schema';

import resolver from './resolver';

export default makeExecutableSchema({
    resolvers: resolver,
    typeDefs: loadSchemaSync(path.join(__dirname, 'registration-schema.graphql'), {
        loaders: [new GraphQLFileLoader()],
    }),
});
