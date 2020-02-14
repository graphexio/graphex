import TypeWrap from '@apollo-model/type-wrap';
import { getNamedType, GraphQLList, isCompositeType } from 'graphql';
import {
  IAMQuerySelector,
  AMModelField,
  AMModelType,
} from '../../../definitions';
import { AMQuerySelectorFieldFactory } from '../querySelectorClass';
import { AMWhereCleanTypeFactory } from '../../whereClean';
import { makeArray } from '../utils';

export class EndsWithSelector extends AMQuerySelectorFieldFactory {
  isApplicable(field: AMModelField) {
    return getNamedType(field.type).toString() === 'String';
  }
  getFieldName(field: AMModelField) {
    return `${field.name}_ends_with`;
  }
  getFieldType(field: AMModelField) {
    const namedType = getNamedType(field.type);

    if (!isCompositeType(namedType)) {
      return namedType;
    }
  }
  transformValue(value: any) {
    return {
      $regex: new RegExp(`${value}$`),
    };
  }
}
