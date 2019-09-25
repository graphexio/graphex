import { QuerySelector } from './interface.js';
import { GraphQLList, GraphQLInt } from 'graphql';
import { extractValue } from './utils';
import TypeWrap from '@apollo-model/type-wrap';

const NotSizeSelector: QuerySelector = {
  applicableForType(type) {
    const typeWrap = new TypeWrap(type);
    return typeWrap.isMany();
  },
  inputType(type) {
    return GraphQLInt;
  },
  transformInput: (input, { field }) => {
    return { [field.name]: { $not: { $size: extractValue(input) } } };
  },
  inputFieldName(fieldName) {
    return `${fieldName}_not_size`;
  },
};

export default NotSizeSelector;
