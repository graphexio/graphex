import { GraphQLSchema, isObjectType, isInterfaceType } from 'graphql';
import { getDirectiveAST } from '../utils';
import { AMModelField, AMModelType } from '../definitions';

export const defaultDirective = (schema: GraphQLSchema) => {
  Object.values(schema.getTypeMap()).forEach((type: AMModelType) => {
    if (isObjectType(type) || isInterfaceType(type)) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        const defaultDirectiveAST = getDirectiveAST(field, 'default');
        if (defaultDirectiveAST) {
          if (!type.mmDefaultFields) type.mmDefaultFields = [];
          type.mmDefaultFields.push(field);
        }
      });
    }
  });
};
