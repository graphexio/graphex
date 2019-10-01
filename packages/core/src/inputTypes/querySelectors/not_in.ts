import TypeWrap from '@apollo-model/type-wrap';
import {
  getNamedType,
  GraphQLInputType,
  GraphQLList,
  isCompositeType,
} from 'graphql';
import { IAMQuerySelector } from '../../types';
import { AMWhereCleanTypeFactory } from '../whereClean';
import { AMQuerySelectorFieldFactory } from './fieldFactory';
import { makeArray } from './utils';

export const NotInSelector: IAMQuerySelector = {
  isApplicable(field) {
    const namedType = getNamedType(field.type);
    return (
      isCompositeType(namedType) ||
      ['ID', 'ObjectID', 'Int', 'Float', 'String'].includes(
        namedType.toString()
      )
    );
  },
  getFieldFactory() {
    return new AMQuerySelectorFieldFactory(
      field => `${field.name}_not_in`,
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
        $not: { $in: makeArray(value) },
      })
    );
  },
};
