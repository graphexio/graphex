import { AMInputField, AMModelField, AMSchemaInfo } from '../definitions';

export type TransformToInputInterface = (params: {
  field: AMModelField;
  schemaInfo: AMSchemaInfo;
}) => AMInputField[];
