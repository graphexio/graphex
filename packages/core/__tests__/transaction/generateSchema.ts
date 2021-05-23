import * as DirectiveImplements from '@apollo-model/directive-implements';
import AMM from '../../src';
import { AMOptions } from '../../src/definitions';

export const generateSchema = (typeDefs, options?: AMOptions) => {
  return new AMM({
    options,
    modules: [DirectiveImplements],
  }).makeExecutableSchema({
    resolverValidationOptions: {
      requireResolversForResolveType: false,
    },
    typeDefs: [typeDefs],
  });
};