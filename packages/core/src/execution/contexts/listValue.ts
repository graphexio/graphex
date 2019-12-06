import { AMContext } from '../context';
import { AMObjectFieldValueType } from '../../types';

export class AMListValueContext extends AMContext {
  values: AMObjectFieldValueType[] = [];

  constructor(values?: AMObjectFieldValueType[]) {
    super();
    if (values) {
      this.values = values;
    }
  }

  addValue(value: AMObjectFieldValueType) {
    this.values.push(value);
  }

  setValues(values: AMObjectFieldValueType[]) {
    this.values = values;
  }

  toJSON() {
    return this.values;
  }
}
