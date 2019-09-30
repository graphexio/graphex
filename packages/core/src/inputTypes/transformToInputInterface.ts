import { GraphQLField, GraphQLOutputType, GraphQLInputType } from 'graphql';
import { AMInputField, AMSchemaInfo } from '../types';
import { INPUT_TYPE_KIND } from './kinds';

export type TransformToInputInterface = (params: {
  field: GraphQLField<any, any, any>;
  schemaInfo: AMSchemaInfo;
}) => AMInputField[];
