import { GraphQLSchema, GraphQLNamedType } from 'graphql';

export const removeUnusedTypes = (schema: GraphQLSchema) => {
  return new GraphQLSchema({
    query: schema.getQueryType(),
    mutation: schema.getMutationType(),
    subscription: schema.getSubscriptionType(),
  });
};
