import { Transform } from '@apollo-model/graphql-tools';
import { createResolveType } from '@apollo-model/graphql-tools/dist/stitching/schemaRecreation';
import TypeWrap from '@apollo-model/type-wrap';
import { GraphQLSchema } from 'graphql';
import * as R from 'ramda';
import { transformRequest } from './transformRequest';
import { transformSchema } from './transformSchema';

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
