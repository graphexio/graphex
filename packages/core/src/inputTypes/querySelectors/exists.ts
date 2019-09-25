import { QuerySelector } from './interface.js';
import { GraphQLList, GraphQLInt } from 'graphql';
import { extractValue } from './utils';
import TypeWrap from '@apollo-model/type-wrap';

const ExistsSelector: QuerySelector = {
  applicableForType(type) {
    return true;
  },
  inputType(type) {
    return GraphQLInt;
  },
  transformInput: (input, { field }) => {
    return { [field.name]: { $exists: extractValue(input) } };
  },
  inputFieldName(fieldName) {
    return `${fieldName}_exists`;
  },
};

export default ExistsSelector;
