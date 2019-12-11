import { AMContext } from '../context';
import { AMObjectFieldValueType, AMModelField } from '../../definitions';

export class AMObjectFieldContext extends AMContext {
  fieldName: string;
  field: AMModelField;
  value: AMObjectFieldValueType;
  nested: boolean = false;

  constructor(fieldName?: string, field?: AMModelField) {
    super();
    this.fieldName = fieldName;
    this.field = field;
  }

  setValue(value: AMObjectFieldValueType) {
    this.value = value;
  }

  addValue(key: string, value: any) {
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
