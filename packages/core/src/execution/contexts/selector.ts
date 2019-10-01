import { AMObjectFieldValueType } from '../../types';
import { AMContext } from '../context';

export class AMSelectorContext extends AMContext {
  selector: { [key: string]: AMObjectFieldValueType } = {};

  addValue(key: string, value: AMObjectFieldValueType) {
    this.selector[key] = value;
  }
}
