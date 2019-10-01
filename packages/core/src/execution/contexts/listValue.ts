import { AMContext } from '../context';
import { AMObjectFieldValueType } from '../../types';

export class AMListValueContext extends AMContext {
  values: AMObjectFieldValueType[] = [];

  addValue(value: AMObjectFieldValueType) {
    this.values.push(value);
  }
}
