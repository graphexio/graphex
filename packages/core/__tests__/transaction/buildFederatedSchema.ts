import * as DirectiveImplements from '@graphex/directive-implements';
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
