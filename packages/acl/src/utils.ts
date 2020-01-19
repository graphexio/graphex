import R from 'ramda';
import { GraphQLSchema, GraphQLType, isAbstractType } from 'graphql';

export const matchingTypes = R.curry((schema: GraphQLSchema, pattern: RegExp) =>
  Object.values(schema.getTypeMap()).filter(type => type.name.match(pattern))
);

export const extractAbstractTypes = R.curry(
  (schema: GraphQLSchema, types: GraphQLType[]) =>
    types.flatMap(type => {
      if (isAbstractType(type)) {
        return [type, ...schema.getPossibleTypes(type)] as GraphQLType[];
      } else {
        return type;
      }
    })
);
