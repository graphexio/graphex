import {
  GraphQLSchema,
  GraphQLNamedType,
  isUnionType,
  isInterfaceType,
  isObjectType,
  isInputObjectType,
  getNamedType,
} from 'graphql';

export const removeUnusedTypes = (schema: GraphQLSchema) => {
  const visitedTypes = new Set<GraphQLNamedType>();

  const visitType = (type: GraphQLNamedType) => {
    if (visitedTypes.has(type)) return;
    visitedTypes.add(type);

    if (isUnionType(type)) {
      type.getTypes().forEach(visitType);
    } else if (isInterfaceType(type)) {
      schema.getPossibleTypes(type).forEach(visitType);
    } else if (isObjectType(type)) {
      Object.values(type.getFields()).forEach(field => {
        visitType(getNamedType(field.type));
        field.args.forEach(arg => {
          visitType(getNamedType(arg.type));
        });
      });
    } else if (isInputObjectType(type)) {
      Object.values(type.getFields()).forEach(field =>
        visitType(getNamedType(field.type))
      );
    }
  };

  [
    schema.getQueryType(),
    schema.getMutationType(),
    schema.getSubscriptionType(),
  ]
    .filter(type => Boolean(type))
    .forEach(visitType);

  return new GraphQLSchema({
    query: schema.getQueryType(),
    mutation: schema.getMutationType(),
    subscription: schema.getSubscriptionType(),
    types: Array.from(visitedTypes.values()),
  });
};
