import {
  GraphQLSchema,
  isObjectType,
  getNamedType,
  isInterfaceType,
} from 'graphql';
import { getDirectiveAST } from '../utils';
import { AMModelField, AMModelType } from '../definitions';

export const fieldFactories = (
  schema: GraphQLSchema,
  fieldFactoriesMap: {}
) => {
  Object.values(schema.getTypeMap()).forEach((type: AMModelType) => {
    if (isObjectType(type) || isInterfaceType(type)) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        let fieldType = getNamedType(field.type);
        if (fieldFactoriesMap[fieldType.name]) {
          field.mmFieldFactories = fieldFactoriesMap[fieldType.name];
        }
      });
    }
  });
};
