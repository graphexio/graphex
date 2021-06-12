import TypeWrap from '@graphex/type-wrap';
import { GraphQLInt } from 'graphql';
import { SelectorOperators } from '@graphex/abstract-datasource-adapter';
import { AMModelField } from '../../../../definitions';
import { AMQuerySelectorFieldFactory } from '../fieldFactories/querySelector';

export class NotSizeSelector extends AMQuerySelectorFieldFactory {
  isApplicable(field: AMModelField) {
    const typeWrap = new TypeWrap(field.type);
    return typeWrap.isMany();
  }
  getFieldName(field: AMModelField) {
    return `${field.name}_not_size`;
  }
  getFieldType() {
    return GraphQLInt;
  }
  transformValue(value: any) {
    return {
      [SelectorOperators.NOT_SIZE]: value,
    };
  }
}
