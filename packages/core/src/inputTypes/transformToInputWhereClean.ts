import { getNamedType, isCompositeType } from 'graphql';
import { TransformToInputInterface } from './transformToInputInterface';
import { AMWhereTypeFactory } from './where';

const transformToInputWhereClean: TransformToInputInterface = params => {
  const fields = [];
  const namedType = getNamedType(params.field.type);

  if (!isCompositeType(namedType)) {
    fields.push(params.field);
  } else {
    fields.push({
      ...params.field,
      type: params.schemaInfo.resolveFactoryType(namedType, AMWhereTypeFactory),
    });
  }

  return fields;
};

export default transformToInputWhereClean;
