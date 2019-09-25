import {
  GraphQLField,
  GraphQLOutputType,
  GraphQLInputType,
  isScalarType,
  isCompositeType,
} from 'graphql';

import { mmGraphQLInputField } from '../types';
import { INPUT_TYPE_KIND } from './kinds';
import { TransformToInputInterface } from './transformToInputInterface';
import TypeWrap from '@apollo-model/type-wrap';

const transformToInputWhereClean: TransformToInputInterface = ({
  field,
  getInputType,
}) => {
  const fields = [];
  const typeWrap = new TypeWrap(field.type);
  const realType = typeWrap.realType();

  if (!isCompositeType(realType)) {
    fields.push(field);
  } else {
    fields.push({
      ...field,
      type: getInputType(realType, INPUT_TYPE_KIND.WHERE_CLEAN),
    });
  }

  return fields;
};

export default transformToInputWhereClean;
