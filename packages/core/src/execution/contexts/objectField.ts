import { AMContext } from '../context';
import { AMObjectFieldValueType } from '../../types';

export class AMObjectFieldContext extends AMContext {
  fieldName: string;
  value: AMObjectFieldValueType;

  constructor(fieldName?: string) {
    super();
    this.fieldName = fieldName;
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
}
