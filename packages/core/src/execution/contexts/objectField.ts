import { AMContext } from '../context';
import { AMObjectFieldValueType, AMModelField } from '../../definitions';
import { SelectorOperator } from '@graphex/abstract-datasource-adapter';

export class AMObjectFieldContext extends AMContext {
  fieldName: string | SelectorOperator;
  field: AMModelField;
  value: AMObjectFieldValueType;
  nested = false;

  constructor(fieldName?: string | SelectorOperator, field?: AMModelField) {
    super();
    this.fieldName = fieldName;
    this.field = field;
  }

  setValue(value: AMObjectFieldValueType) {
    this.value = value;
  }

  addValue(key: string | SelectorOperator, value: any) {
    if (!(this.value instanceof Object)) {
      this.value = {};
    }
    this.value[key] = value;
  }

  setNested(nested: boolean) {
    this.nested = nested;
  }

  isNested() {
    return this.nested;
  }
}
