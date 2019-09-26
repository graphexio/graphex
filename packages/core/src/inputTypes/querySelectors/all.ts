import { GraphQLList, isCompositeType } from 'graphql';
import { INPUT_TYPE_KIND } from '../kinds';
import QuerySelector from './interface';
import { extractValue, makeArray } from './utils';

export default class AllSelector extends QuerySelector {
  _selectorName = 'all';

  isApplicable() {
    return this._typeWrap.isMany();
  }

  getInputFieldType() {
    const realType = this._typeWrap.realType();

    if (!isCompositeType(realType)) {
      return new GraphQLList(realType);
    } else {
      return new GraphQLList(
        this._getInputType(realType, INPUT_TYPE_KIND.WHERE_CLEAN)
      );
    }
  }

  getTransformInput() {
    const fieldName = this.getFieldName();
    return input => ({
      [fieldName]: { $all: makeArray(extractValue(input)) },
    });
  }
}
