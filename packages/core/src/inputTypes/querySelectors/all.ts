import { QuerySelector } from './interface.js';
import { GraphQLList, GraphQLInt, isScalarType } from 'graphql';
import { extractValue, makeArray } from './utils';
import { INPUT_TYPE_KIND } from '../kinds';
import TypeWrap from '@apollo-model/type-wrap';

const AllSelector: QuerySelector = {
  applicableForType(type) {
    const typeWrap = new TypeWrap(type);
    return typeWrap.isMany();
  },
  inputType: (type, { getInputType }) => {
    const typeWrap = new TypeWrap(type);
    const realType = typeWrap.realType();

    if (isScalarType(realType)) {
      return new GraphQLList(realType);
    } else {
      return getInputType(realType, INPUT_TYPE_KIND.WHERE);
    }
  },
  transformInput: (input, { field }) => {
    return { [field.name]: { $all: makeArray(extractValue(input)) } };
  },
  inputFieldName(fieldName) {
    return `${fieldName}_all`;
  },
};

export default AllSelector;
