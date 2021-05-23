import AMM from '../../src';
import { AMOptions } from '../../src/definitions';

export const generateSchema = (typeDefs, options?: AMOptions) => {
  return new AMM({ options }).makeExecutableSchema({
    resolverValidationOptions: {
      requireResolversForResolveType: false,
    },
    typeDefs,
  });
};