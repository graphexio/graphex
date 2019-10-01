import TypeWrap from '@apollo-model/type-wrap';
import { GraphQLField, isInputObjectType } from 'graphql';
import { INPUT_TYPE_KIND } from './kinds';
import { Selectors } from './querySelectors';
import * as Transforms from './transforms';
import { TransformToInputInterface } from './transformToInputInterface';
import { reduceTransforms } from './utils';
import { IAMQuerySelector, AMSchemaInfo, AMModelField } from '../types';

const isApplicable = (field: AMModelField) => (selector: IAMQuerySelector) =>
  selector.isApplicable(field);

const selectorToField = (field: AMModelField, schemaInfo: AMSchemaInfo) => (
  selector: IAMQuerySelector
) => {
  return selector.getFieldFactory().getField(field, schemaInfo);
};

const transformToInputWhere: TransformToInputInterface = params => {
  return Selectors.filter(isApplicable(params.field)).map(
    selectorToField(params.field, params.schemaInfo)
  );
};

export default transformToInputWhere;
