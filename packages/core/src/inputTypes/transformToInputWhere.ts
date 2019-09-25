import { GraphQLField, isCompositeType, isInputObjectType } from 'graphql';
import { QuerySelector, Selectors } from './querySelectors';
import * as Transforms from './transforms';
import { TransformToInputInterface } from './transformToInputInterface';
import { reduceTransforms } from './utils';

const applicableForField = (field: GraphQLField<any, any, any>) => (
  selector: QuerySelector
) => selector.applicableForType(field.type);

const selectorToField = (field, getInputType) => (selector: QuerySelector) => {
  const type = selector.inputType(field.type, { getInputType });
  return {
    type,
    name: selector.inputFieldName(field.name),
    mmTransform: reduceTransforms([
      isInputObjectType(type) ? Transforms.applyNestedTransform(type) : null,
      input => selector.transformInput(input, { field }),
    ]),
  };
};

const transformToInputWhere: TransformToInputInterface = ({
  field,
  getInputType,
}) => {
  return Selectors.filter(applicableForField(field)).map(
    selectorToField(field, getInputType)
  );
};

export default transformToInputWhere;
