import TypeWrap from '@apollo-model/type-wrap';
import { GraphQLInt } from 'graphql';
import { AMModelField } from '../../../definitions';
import { AMQuerySelectorFieldFactory } from '../querySelectorClass';

export class SizeSelector extends AMQuerySelectorFieldFactory {
  isApplicable(field: AMModelField) {
    const typeWrap = new TypeWrap(field.type);
    return typeWrap.isMany();
  }
  getFieldName(field: AMModelField) {
    return `${field.name}_size`;
  }
  getFieldType(field: AMModelField) {
    return GraphQLInt;
  }
  transformValue(value: any) {
    return {
      $size: value,
    };
  }
}
