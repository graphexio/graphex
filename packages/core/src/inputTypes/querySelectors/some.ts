import TypeWrap from '@apollo-model/type-wrap';
import { isCompositeType } from 'graphql';
import { INPUT_TYPE_KIND } from '../kinds';
import { QuerySelector } from './interface.js';
import { extractValue } from './utils';

const ExactSelector: QuerySelector = {
  applicableForType(type) {
    const typeWrap = new TypeWrap(type);
    return typeWrap.isMany();
  },
  inputType: (type, { getInputType }) => {
    const typeWrap = new TypeWrap(type);
    const realType = typeWrap.realType();

    if (!isCompositeType(realType)) {
      return realType;
    } else {
      return getInputType(realType, INPUT_TYPE_KIND.WHERE);
    }
  },
  transformInput: (input, { field }) => {
    return { [field.name]: { $elemMatch: extractValue(input) } };
  },
  inputFieldName(fieldName) {
    return `${fieldName}_some`;
  },
};

export default ExactSelector;
