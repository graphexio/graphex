import { GraphQLSchema, isObjectType, isInterfaceType } from 'graphql';
import { getDirectiveAST } from '../utils';
import { AMModelField, AMModelType } from '../definitions';

export const createdAtDirective = (schema: GraphQLSchema) => {
  Object.values(schema.getTypeMap()).forEach((type: AMModelType) => {
    if (isObjectType(type) || isInterfaceType(type)) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        const createdAtDirectiveAST = getDirectiveAST(field, 'createdAt');
        if (createdAtDirectiveAST) {
          if (!type.mmCreatedAtFields) type.mmCreatedAtFields = [];
          type.mmCreatedAtFields.push(field);
        }
      });
    }
  });
};
