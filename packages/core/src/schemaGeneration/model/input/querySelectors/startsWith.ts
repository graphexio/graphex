import { getNamedType, isCompositeType } from 'graphql';
import { AMModelField } from '../../../../definitions';
import { AMQuerySelectorFieldFactory } from '../fieldFactories/querySelector';

export class StartsWithSelector extends AMQuerySelectorFieldFactory {
  isApplicable(field: AMModelField) {
    return getNamedType(field.type).toString() === 'String';
  }
  getFieldName(field: AMModelField) {
    return `${field.name}_starts_with`;
  }
  getFieldType(field: AMModelField) {
    const namedType = getNamedType(field.type);

    if (!isCompositeType(namedType)) {
      return namedType;
    }
  }
  transformValue(value: any) {
    return {
      $regex: new RegExp(`^${value}`),
    };
  }
}
