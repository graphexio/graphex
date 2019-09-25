import TypeWrap from '@apollo-model/type-wrap';
import { GraphQLList, isCompositeType } from 'graphql';
import { INPUT_TYPE_KIND } from '../kinds';
import { QuerySelector } from './interface.js';
import { extractValue, makeArray } from './utils';

const InSelector: QuerySelector = {
  applicableForType(type) {
    const typeWrap = new TypeWrap(type);
    return typeWrap.isMany();
  },
  inputType: (type, { getInputType }) => {
    const typeWrap = new TypeWrap(type);
    const realType = typeWrap.realType();

    if (!isCompositeType(realType)) {
      return new GraphQLList(realType);
    } else {
      return getInputType(realType, INPUT_TYPE_KIND.WHERE_CLEAN);
    }
  },
  transformInput: (input, { field }) => {
    return { [field.name]: { $in: makeArray(extractValue(input)) } };
  },
  inputFieldName(fieldName) {
    return `${fieldName}_in`;
  },
};

export default InSelector;
