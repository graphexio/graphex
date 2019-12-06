import { GraphQLSchema, isObjectType } from 'graphql';
import { getDirectiveAST } from '../tsutils';
import { AMModelField, AMModelType } from '../types';

export const createdAtDirective = (schema: GraphQLSchema) => {
  Object.values(schema.getTypeMap()).forEach((type: AMModelType) => {
    if (isObjectType(type)) {
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
