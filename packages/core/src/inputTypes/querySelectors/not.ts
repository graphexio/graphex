import TypeWrap from '@apollo-model/type-wrap';
import { GraphQLInt, getNamedType, isCompositeType } from 'graphql';
import { IAMQuerySelector } from '../../types';
import { AMQuerySelectorFieldFactory } from './fieldFactory';

export const NotSelector: IAMQuerySelector = {
  isApplicable(field) {
    const namedType = getNamedType(field.type);
    return !isCompositeType(namedType);
  },
  getFieldFactory() {
    return new AMQuerySelectorFieldFactory(
      field => `${field.name}_not`,
      (field, schemaInfo) => {
        const namedType = getNamedType(field.type);

        if (!isCompositeType(namedType)) {
          return namedType;
        }
      },
      value => ({
        $not: { $eq: value },
      })
    );
  },
};
