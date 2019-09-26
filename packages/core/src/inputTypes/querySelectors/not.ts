import { GraphQLList, isCompositeType } from 'graphql';
import { INPUT_TYPE_KIND } from '../kinds';
import QuerySelector from './interface';
import { extractValue, makeArray } from './utils';

export default class LTSelector extends QuerySelector {
  _selectorName = 'not';

  isApplicable() {
    const realType = this._typeWrap.realType();
    return !isCompositeType(realType);
  }

  getInputFieldType() {
    const realType = this._typeWrap.realType();

    if (!isCompositeType(realType)) {
      return realType;
    }
  }

  getTransformInput() {
    const fieldName = this.getFieldName();
    return input => ({
      [fieldName]: { $not: { $eq: extractValue(input) } },
    });
  }
}
