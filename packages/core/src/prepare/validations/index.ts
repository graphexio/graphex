import { GraphQLSchema } from 'graphql';
import { validateObjectFieldType } from './objectFieldType';
import { validateRelations } from './relations';

export const validations = (schema: GraphQLSchema) => {
  validateObjectFieldType(schema);
  validateRelations(schema);
};
