import TypeWrap from '@graphex/type-wrap';
import { getNamedType, GraphQLList, isCompositeType } from 'graphql';
import {
  IAMQuerySelector,
  AMModelField,
  AMModelType,
} from '../../../definitions';
import { AMQuerySelectorFieldFactory } from '../querySelector';
import { AMWhereCleanTypeFactory } from '../../whereClean';
import { makeArray } from '../utils';

export class NotSelector extends AMQuerySelectorFieldFactory {
  isApplicable(field: AMModelField) {
    const namedType = getNamedType(field.type);
    return !isCompositeType(namedType);
  }
  getFieldName(field: AMModelField) {
    return `${field.name}_not`;
  }
  getFieldType(field: AMModelField) {
    const namedType = getNamedType(field.type);

    if (!isCompositeType(namedType)) {
      return namedType;
    }
  }
  transformValue(value: any) {
    return {
      $not: { $eq: value },
    };
  }
}
