import { getNamedType, isCompositeType } from 'graphql';
import { SelectorOperators } from '@graphex/abstract-datasource-adapter';
import { AMModelField } from '../../../../definitions';
import { AMQuerySelectorFieldFactory } from '../fieldFactories/querySelector';

export class LTESelector extends AMQuerySelectorFieldFactory {
  isApplicable(field: AMModelField) {
    const namedType = getNamedType(field.type);
    return ['Int', 'Float', 'Date', 'String'].includes(namedType.toString());
  }
  getFieldName(field: AMModelField) {
    return `${field.name}_lte`;
  }
  getFieldType(field: AMModelField) {
    const namedType = getNamedType(field.type);
    if (!isCompositeType(namedType)) {
      return namedType;
    }
  }
  transformValue(value: any) {
    return {
      [SelectorOperators.LTE]: value,
    };
  }
}
