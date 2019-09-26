import { GraphQLList, isCompositeType, isInputObjectType } from 'graphql';
import { INPUT_TYPE_KIND } from '../kinds';
import QuerySelector from './interface';
import { extractValue, makeArray } from './utils';
import { reduceTransforms } from '../utils';
import * as Transforms from '../transforms';

export default class AsIsSelector extends QuerySelector {
  _selectorName = 'asis';

  isApplicable() {
    return !this._typeWrap.isMany();
  }

  getInputFieldType() {
    const realType = this._typeWrap.realType();

    if (!isCompositeType(realType)) {
      return realType;
    } else {
      const isInterface = this._typeWrap.isInterface();
      return this._getInputType(
        realType,
        isInterface ? INPUT_TYPE_KIND.WHERE_INTERFACE : INPUT_TYPE_KIND.WHERE
      );
    }
  }

  getInputFieldName() {
    return this.getFieldName();
  }

  getTransformInput() {
    const isNested = this._typeWrap.isNested();

    return reduceTransforms([isNested ? Transforms.flattenNested : null]);
  }
}
