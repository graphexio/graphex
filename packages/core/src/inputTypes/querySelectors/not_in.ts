import TypeWrap from '@apollo-model/type-wrap';
import { GraphQLList, isCompositeType } from 'graphql';
import { INPUT_TYPE_KIND } from '../kinds';
import { QuerySelector } from './interface.js';
import { extractValue, makeArray } from './utils';

const NotInSelector: QuerySelector = {
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
    return { [field.name]: { $not: { $in: makeArray(extractValue(input)) } } };
  },
  inputFieldName(fieldName) {
    return `${fieldName}_not_in`;
  },
};

export default NotInSelector;
