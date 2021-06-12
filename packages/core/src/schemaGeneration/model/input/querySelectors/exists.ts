import { GraphQLBoolean } from 'graphql';
import { SelectorOperators } from '@graphex/abstract-datasource-adapter';
import { AMModelField } from '../../../../definitions';
import { AMQuerySelectorFieldFactory } from '../fieldFactories/querySelector';

export class ExistsSelector extends AMQuerySelectorFieldFactory {
  isApplicable() {
    return true;
  }
  getFieldName(field: AMModelField) {
    return `${field.name}_exists`;
  }
  getFieldType() {
    return GraphQLBoolean;
  }
  transformValue(value: any) {
    return {
      [SelectorOperators.EXISTS]: value,
    };
  }
}
