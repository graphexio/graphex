import * as DirectiveImplements from '@apollo-model/directive-implements';
import AMM from '../../src';

export const buildFederatedSchema = typeDefs => {
  return new AMM({
    modules: [DirectiveImplements],
  }).buildFederatedSchema({
    resolverValidationOptions: {
      requireResolversForResolveType: false,
    },
    typeDefs: [typeDefs],
  });
};
