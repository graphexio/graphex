import { AMContext } from '../context';
import { AMObjectFieldValueType } from '../../types';

type Data = { [key: string]: AMObjectFieldValueType };

export class AMDataContext extends AMContext {
  data: Data = {};

  constructor(data?: Data) {
    super();
    if (data) {
      this.data = data;
    }
  }

  addValue(key: string, value: AMObjectFieldValueType) {
    this.data[key] = value;
  }

  toJSON() {
    return this.data;
  }
}
