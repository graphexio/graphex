import { GraphQLInt } from 'graphql';
import QuerySelector from './interface';
import { extractValue } from './utils';

export default class SizeSelector extends QuerySelector {
  _selectorName = 'size';

  isApplicable() {
    return this._typeWrap.isMany();
  }

  getInputFieldType() {
    return GraphQLInt;
  }

  getTransformInput() {
    const fieldName = this.getFieldName();
    return input => ({
      [fieldName]: { $size: extractValue(input) },
    });
  }
}
