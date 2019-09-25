import { GraphQLField, GraphQLOutputType, GraphQLInputType } from 'graphql';
import { mmGraphQLInputField } from '../types';
import { INPUT_TYPE_KIND } from './kinds';

export type TransformToInputInterface = (params: {
  field: GraphQLField<any, any, any>;
  getInputType: (
    type: GraphQLOutputType,
    kind: INPUT_TYPE_KIND
  ) => GraphQLInputType;
}) => mmGraphQLInputField[];
