import { AMContext } from '../context';
import { AMObjectFieldValueType } from '../../definitions';
import { toArray } from '../../utils';

export class AMListValueContext extends AMContext {
  values: AMObjectFieldValueType[] = [];
  proxy: boolean = false;

  constructor(values?: AMObjectFieldValueType[]) {
    super();
    if (values) {
      this.values = values;
    }
  }

  addValue(value: AMObjectFieldValueType | AMObjectFieldValueType[]) {
    if (this.proxy) {
      this.values = toArray(<AMObjectFieldValueType[]>value);
    } else {
      this.values.push(value);
    }
  }

  setValues(values: AMObjectFieldValueType[]) {
    this.values = values;
  }

  setProxy(value: boolean) {
    this.proxy = value;
  }

  toJSON() {
    return this.values;
  }
}
