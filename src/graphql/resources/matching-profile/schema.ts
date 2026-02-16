import { makeExecutableSchema } from '@graphql-tools/schema';
import { matchingProfileTypeDefs, matchingProfileResolvers } from './index';

export default makeExecutableSchema({
    typeDefs: matchingProfileTypeDefs,
    resolvers: matchingProfileResolvers,
});
