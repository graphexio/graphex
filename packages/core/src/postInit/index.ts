import { relationDirective } from './relationDirective';
import { GraphQLSchema } from 'graphql';

export const postInit = (schema: GraphQLSchema) => {
  relationDirective(schema);
};
