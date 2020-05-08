import { Transform } from '@apollo-model/graphql-tools';
import { GraphQLSchema } from 'graphql';
import { transformRequest } from './transformRequest';
import { transformSchema } from './transformSchema';
export { removeUnusedTypes } from './removeUnusedTypes';

export const SchemaFilter: (transformOptions: {
  filterFields;
  defaultFields;
  defaultArgs;
}) => Transform = transformOptions => {
  const transformContext: {
    initialSchema?: GraphQLSchema;
    defaults?: any;
  } = {};

  return {
    transformSchema: transformSchema(transformOptions, transformContext),
    transformRequest: transformRequest(transformOptions, transformContext),
  };
};
