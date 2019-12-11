import { GraphQLSchema, isCompositeType, isObjectType } from 'graphql';
import { AMModelField } from '../definitions';

export const fillDbName = (schema: GraphQLSchema) => {
  Object.values(schema.getTypeMap()).forEach(type => {
    if (isObjectType(type)) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        if (!field.dbName) field.dbName = field.name;
      });
    }
  });
};
