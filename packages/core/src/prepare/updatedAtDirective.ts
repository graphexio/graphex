import { GraphQLSchema, isObjectType, isInterfaceType } from 'graphql';
import { getDirectiveAST } from '../tsutils';
import { AMModelField, AMModelType } from '../definitions';

export const updatedAtDirective = (schema: GraphQLSchema) => {
  Object.values(schema.getTypeMap()).forEach((type: AMModelType) => {
    if (isObjectType(type) || isInterfaceType(type)) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        const updatedAtDirectiveAST = getDirectiveAST(field, 'updatedAt');
        if (updatedAtDirectiveAST) {
          if (!type.mmUpdatedAtFields) type.mmUpdatedAtFields = [];
          type.mmUpdatedAtFields.push(field);
        }
      });
    }
  });
};
