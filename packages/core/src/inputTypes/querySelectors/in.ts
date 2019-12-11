import TypeWrap from '@apollo-model/type-wrap';
import {
  getNamedType,
  GraphQLInputType,
  GraphQLList,
  isCompositeType,
} from 'graphql';
import { IAMQuerySelector } from '../../definitions';
import { AMWhereCleanTypeFactory } from '../whereClean';
import { makeArray } from './utils';
import { AMQuerySelectorFieldFactory } from '../fieldFactories/querySelector';

export const InSelector: IAMQuerySelector = {
  isApplicable(field) {
    const namedType = getNamedType(field.type);
    return (
      (isCompositeType(namedType) ||
        ['ID', 'ObjectID', 'Int', 'Float', 'String'].includes(
          namedType.toString()
        )) &&
      !field.relation
    );
  },
  getFieldFactory() {
    return new AMQuerySelectorFieldFactory(
      this.isApplicable,
      field => `${field.name}_in`,
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
        $in: makeArray(value),
      })
    );
  },
};
