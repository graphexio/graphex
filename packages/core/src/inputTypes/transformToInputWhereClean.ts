import TypeWrap from '@apollo-model/type-wrap';
import { isCompositeType, getNamedType } from 'graphql';
import { INPUT_TYPE_KIND } from './kinds';
import { TransformToInputInterface } from './transformToInputInterface';
import { AMSchemaInfo } from '../types';
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
