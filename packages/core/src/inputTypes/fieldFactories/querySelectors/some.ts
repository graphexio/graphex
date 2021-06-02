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

export class SomeSelector extends AMQuerySelectorFieldFactory {
  isApplicable(field: AMModelField) {
    const typeWrap = new TypeWrap(field.type);
    return !field.relation && typeWrap.isMany();
  }
  getFieldName(field: AMModelField) {
    return `${field.name}_some`;
  }
  getFieldType(field: AMModelField) {
    const namedType = getNamedType(field.type);
    if (!isCompositeType(namedType)) {
      return namedType;
    } else {
      return this.configResolver.resolveInputType(
        namedType as AMModelType,
        this.links.where
      );
    }
  }
  transformValue(value: any) {
    return {
      $elemMatch: value,
    };
  }
}
