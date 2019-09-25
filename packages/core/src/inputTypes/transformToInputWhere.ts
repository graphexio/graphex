import {
  GraphQLField,
  GraphQLInputField,
  GraphQLOutputType,
  GraphQLInputType,
} from 'graphql';
import { Selectors, QuerySelector } from './querySelectors';
import { mmGraphQLInputField } from '../types';
import { INPUT_TYPE_KIND } from './kinds';

const applicableForField = (field: GraphQLField<any, any, any>) => (
  selector: QuerySelector
) => selector.applicableForType(field.type);

const selectorToField = (field, getInputType) => (selector: QuerySelector) => ({
  type: selector.inputType(field.type, { getInputType }),
  name: selector.inputFieldName(field.name),
  mmTransform: input => selector.transformInput(input, { field }),
});

export default ({
  field,
  getInputType,
}: {
  field: GraphQLField<any, any, any>;
  getInputType: (
    type: GraphQLOutputType,
    kind: INPUT_TYPE_KIND
  ) => GraphQLInputType;
}): mmGraphQLInputField[] => {
  return Selectors.filter(applicableForField(field)).map(
    selectorToField(field, getInputType)
  );
};
