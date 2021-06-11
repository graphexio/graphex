import { getNamedType, isCompositeType } from 'graphql';
import { AMModelField } from '../../../../definitions';
import { AMQuerySelectorFieldFactory } from '../fieldFactories/querySelector';

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
