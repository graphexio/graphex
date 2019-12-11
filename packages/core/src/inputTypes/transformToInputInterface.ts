import { GraphQLField, GraphQLOutputType, GraphQLInputType } from 'graphql';
import { AMInputField, AMSchemaInfo, AMModelField } from '../definitions';
import { INPUT_TYPE_KIND } from './kinds';

export type TransformToInputInterface = (params: {
  field: AMModelField;
  schemaInfo: AMSchemaInfo;
}) => AMInputField[];
