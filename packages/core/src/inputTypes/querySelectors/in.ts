import { GraphQLList, isCompositeType } from 'graphql';
import { INPUT_TYPE_KIND } from '../kinds';
import QuerySelector from './interface';
import { extractValue, makeArray } from './utils';

export default class InSelector extends QuerySelector {
  _selectorName = 'in';

  isApplicable() {
    return (
      this._typeWrap.isMany() ||
      ['ID', 'ObjectID', 'Int', 'Float', 'String'].includes(
        this._typeWrap.realType().toString()
      )
    );
  }

  getInputFieldType() {
    const realType = this._typeWrap.realType();

    if (!isCompositeType(realType)) {
      return new GraphQLList(realType);
    } else {
      return this._getInputType(realType, INPUT_TYPE_KIND.WHERE_CLEAN);
    }
  }

  getTransformInput() {
    const fieldName = this.getFieldName();
    return input => ({
      [fieldName]: { $in: makeArray(extractValue(input)) },
    });
  }
}
