import { relationDirective } from './relationDirective';
import { nestedArrays } from './nestedArrays';
import { GraphQLSchema } from 'graphql';
import { AMSchemaInfo, AMOptions } from '../definitions';
import { AMConfigResolver } from '../config/resolver';

export const postInit = (options: {
  schema: GraphQLSchema;
  schemaInfo: AMSchemaInfo;
  configResolver: AMConfigResolver;
  amOptions: AMOptions;
}) => {
  relationDirective(options.schema, options.configResolver);
  if (options?.amOptions?.nestedArraysFilter) {
    nestedArrays(options.schema, options.configResolver);
  }
};
