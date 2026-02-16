import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeResolvers, mergeTypeDefs } from '@graphql-tools/merge';
import path from 'path';

import resolver from './resolver';

const typesArray = loadFilesSync(path.join(__dirname, './*.graphql'));

export const matchingProfileTypeDefs = mergeTypeDefs(typesArray);
export const matchingProfileResolvers = mergeResolvers([resolver]);
