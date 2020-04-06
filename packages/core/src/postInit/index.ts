import { relationDirective } from './relationDirective';
import { nestedArrays } from './nestedArrays';
import { GraphQLSchema } from 'graphql';
import { AMSchemaInfo } from '../definitions';
import { AMConfigResolver } from '../config/resolver';

export const postInit = (options: {
  schema: GraphQLSchema;
  schemaInfo: AMSchemaInfo;
  configResolver: AMConfigResolver;
}) => {
  relationDirective(options.schema, options.configResolver);
  nestedArrays(options.schema, options.configResolver);
};
