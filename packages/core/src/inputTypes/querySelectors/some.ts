import { GraphQLList, isCompositeType } from 'graphql';
import { INPUT_TYPE_KIND } from '../kinds';
import QuerySelector from './interface';
import { extractValue, makeArray } from './utils';

export default class SomeSelector extends QuerySelector {
  _selectorName = 'some';

  isApplicable() {
    return this._typeWrap.isMany();
  }

  getInputFieldType() {
    const realType = this._typeWrap.realType();

    if (!isCompositeType(realType)) {
      return realType;
    } else {
      return this._getInputType(realType, INPUT_TYPE_KIND.WHERE);
    }
  }

  getTransformInput() {
    const fieldName = this.getFieldName();
    return input => ({
      [fieldName]: { $elemMatch: extractValue(input) },
    });
  }
}
