import {
  GraphQLField,
  GraphQLInputField,
  GraphQLSchema,
  GraphQLType,
  isAbstractType,
  isInputObjectType,
  isObjectType,
  isInterfaceType,
} from 'graphql';
import R from 'ramda';

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

export const matchingFields = R.curry(
  (schema: GraphQLSchema, typeName, pattern: RegExp) => {
    const type = schema.getType(typeName);
    if (
      isObjectType(type) ||
      isInputObjectType(type) ||
      isInterfaceType(type)
    ) {
      const fields = type.getFields();
      return Object.values(
        fields
      ).filter((field: GraphQLField<any, any, any> | GraphQLInputField) =>
        field.name.match(pattern)
      );
    } else {
      return [];
    }
  }
);

export const toEntries = str => [str, true];
export const toMap = entries => new Map(entries);
