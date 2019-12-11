import { AMObjectFieldValueType } from '../../definitions';
import { AMContext } from '../context';

type Selector = { [key: string]: AMObjectFieldValueType };

export class AMSelectorContext extends AMContext {
  selector: Selector = {};

  constructor(selector?: Selector) {
    super();
    if (selector) {
      this.selector = selector;
    }
  }

  addValue(key: string, value: AMObjectFieldValueType) {
    this.selector[key] = value;
  }

  toJSON() {
    return this.selector;
  }
}
