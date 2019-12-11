import { GraphQLSchema, isObjectType, getNamedType } from 'graphql';
import { getDirectiveAST } from '../tsutils';
import { AMModelField, AMModelType } from '../definitions';

export const fieldFactories = (
  schema: GraphQLSchema,
  fieldFactoriesMap: {}
) => {
  Object.values(schema.getTypeMap()).forEach((type: AMModelType) => {
    if (isObjectType(type)) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        let fieldType = getNamedType(field.type);
        if (fieldFactoriesMap[fieldType.name]) {
          field.mmFieldFactories = fieldFactoriesMap[fieldType.name];
        }
      });
    }
  });
};
