import { getNamedType, isCompositeType } from 'graphql';
import { AMModelField } from '../../../definitions';
import { AMQuerySelectorFieldFactory } from '../../fieldFactories/querySelectorClass';

export class GTSelector extends AMQuerySelectorFieldFactory {
  isApplicable(field: AMModelField) {
    const namedType = getNamedType(field.type);
    return ['Int', 'Float', 'Date', 'String'].includes(namedType.toString());
  }
  getFieldName(field: AMModelField) {
    return `${field.name}_gt`;
  }
  getFieldType(field: AMModelField) {
    const namedType = getNamedType(field.type);
    if (!isCompositeType(namedType)) {
      return namedType;
    }
  }
  transformValue(value: any) {
    return {
      $gt: value,
    };
  }
}
