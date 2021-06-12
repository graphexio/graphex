import { AMObjectFieldValueType } from '../../definitions';
import { AMContext } from '../context';
import {
  Selector,
  SelectorOperator,
} from '@graphex/abstract-datasource-adapter';

export class AMSelectorContext extends AMContext {
  selector: Selector = {};

  constructor(selector?: Selector) {
    super();
    if (selector) {
      this.selector = selector;
    }
  }

  addValue(key: string | SelectorOperator, value: AMObjectFieldValueType) {
    this.selector[key as any] = value;
  }

  toJSON() {
    return this.selector;
  }
}
