import { GraphQLField, isCompositeType, isInputObjectType } from 'graphql';
import { QuerySelector, Selectors } from './querySelectors';
import * as Transforms from './transforms';
import { TransformToInputInterface } from './transformToInputInterface';
import { reduceTransforms } from './utils';
import TypeWrap from '@apollo-model/type-wrap';
import { INPUT_TYPE_KIND } from './kinds';

const isApplicable = selector => selector.isApplicable();

const applySelector = (params: {
  field: GraphQLField<any, any, any>;
  getInputType;
}) => selector => new selector(params);

const selectorToField = (selector: QuerySelector) => {
  const type = selector.getInputFieldType();
  const typeWrap = new TypeWrap(type);
  const realType = typeWrap.realType();

  return {
    type,
    name: selector.getInputFieldName(),
    mmTransform: reduceTransforms([
      Transforms.fieldInputTransform(
        selector._field,
        selector._typeWrap.isInterface()
          ? INPUT_TYPE_KIND.WHERE_INTERFACE
          : INPUT_TYPE_KIND.WHERE
      ),
      isInputObjectType(realType)
        ? Transforms.applyNestedTransform(realType)
        : null,
      selector._typeWrap.isInterface()
        ? Transforms.validateAndTransformInterfaceInput(type)
        : null,
      selector.getTransformInput(),
    ]),
  };
};

const transformToInputWhere: TransformToInputInterface = ({
  field,
  getInputType,
}) => {
  return Selectors.map(applySelector({ field, getInputType }))
    .filter(isApplicable)
    .map(selectorToField);
};

export default transformToInputWhere;
