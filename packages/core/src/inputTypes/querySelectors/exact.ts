import {
  getNamedType,
  GraphQLInputType,
  isCompositeType,
  GraphQLList,
} from 'graphql';
import { IAMQuerySelector } from '../../types';
import TypeWrap from '@apollo-model/type-wrap';
import { AMWhereCleanTypeFactory } from '../whereClean';
import { AMQuerySelectorFieldFactory } from '../fieldFactories/querySelector';
import { makeArray } from './utils';

export const ExactSelector: IAMQuerySelector = {
  isApplicable(field) {
    const typeWrap = new TypeWrap(field.type);
    return typeWrap.isMany();
  },
  getFieldFactory() {
    return new AMQuerySelectorFieldFactory(
      this.isApplicable,
      field => `${field.name}_exact`,
      (field, schemaInfo) => {
        const namedType = getNamedType(field.type);

        if (!isCompositeType(namedType)) {
          return new GraphQLList(namedType);
        } else {
          return new GraphQLList(
            schemaInfo.resolveFactoryType(namedType, AMWhereCleanTypeFactory)
          );
        }
      },
      value => ({
        $eq: makeArray(value),
      })
    );
  },
};
