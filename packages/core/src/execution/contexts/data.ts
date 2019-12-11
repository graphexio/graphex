import { AMContext } from '../context';
import { AMObjectFieldValueType } from '../../definitions';

type Data = { [key: string]: AMObjectFieldValueType };

export class AMDataContext extends AMContext {
  data: Data;

  constructor(data?: Data) {
    super();
    if (data) {
      this.data = data;
    }
  }

  addValue(key: string, value: AMObjectFieldValueType) {
    if (!this.data) this.data = {};
    this.data[key] = value;
  }

  setData(value: Data) {
    this.data = value;
  }

  toJSON() {
    return this.data;
  }
}
