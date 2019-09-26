import { GraphQLList, isCompositeType } from 'graphql';
import { INPUT_TYPE_KIND } from '../kinds';
import QuerySelector from './interface';
import { extractValue, makeArray } from './utils';

export default class StartsWithSelector extends QuerySelector {
  _selectorName = 'starts_with';

  isApplicable() {
    return ['String'].includes(this._typeWrap.realType().toString());
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
      [fieldName]: { $regex: new RegExp(`^${extractValue(input)}`) },
    });
  }
}
