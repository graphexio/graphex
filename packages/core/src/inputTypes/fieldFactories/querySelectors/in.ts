import TypeWrap from '@apollo-model/type-wrap';
import {
  getNamedType,
  GraphQLList,
  isCompositeType,
  isEnumType,
} from 'graphql';
import {
  IAMQuerySelector,
  AMModelField,
  AMModelType,
} from '../../../definitions';
import { AMQuerySelectorFieldFactory } from '../../fieldFactories/querySelectorClass';
import { AMWhereCleanTypeFactory } from '../../whereClean';
import { makeArray } from '../utils';

export class InSelector extends AMQuerySelectorFieldFactory {
  isApplicable(field: AMModelField) {
    const namedType = getNamedType(field.type);
    return (
      (isCompositeType(namedType) ||
        isEnumType(namedType) ||
        ['ID', 'ObjectID', 'Int', 'Float', 'String'].includes(
          namedType.toString()
        )) &&
      !field.relation
    );
  }
  getFieldName(field: AMModelField) {
    return `${field.name}_in`;
  }
  getFieldType(field: AMModelField) {
    const namedType = getNamedType(field.type);
    if (!isCompositeType(namedType)) {
      return new GraphQLList(namedType);
    } else {
      return new GraphQLList(
        this.configResolver.resolveInputType(
          namedType as AMModelType,
          this.links.whereClean
        )
      );
    }
  }
  transformValue(value: any) {
    return {
      $in: makeArray(value),
    };
  }
}
