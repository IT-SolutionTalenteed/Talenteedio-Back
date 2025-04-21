import path from 'path';

import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { makeExecutableSchema } from '@graphql-tools/schema';

import resolvers from './resolver';

export default makeExecutableSchema({
    resolvers,
    typeDefs: loadSchemaSync(path.join(__dirname, 'schema.graphql'), {
        loaders: [new GraphQLFileLoader()],
    }),
});
