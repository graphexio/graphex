import TypeWrap from '@apollo-model/type-wrap';
import {
  getNamedType,
  GraphQLInputType,
  GraphQLList,
  isCompositeType,
} from 'graphql';
import { IAMQuerySelector } from '../../definitions';
import { AMWhereCleanTypeFactory } from '../whereClean';
import { AMQuerySelectorFieldFactory } from '../fieldFactories/querySelector';
import { makeArray } from './utils';

export const AllSelector: IAMQuerySelector = {
  isApplicable(field) {
    const typeWrap = new TypeWrap(field.type);
    return typeWrap.isMany();
  },
  getFieldFactory() {
    return new AMQuerySelectorFieldFactory(
      this.isApplicable,
      field => `${field.name}_all`,
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
        $all: makeArray(value),
      })
    );
  },
};
