import { GraphQLInt } from 'graphql';
import QuerySelector from './interface';
import { extractValue } from './utils';

export default class NotSizeSelector extends QuerySelector {
  _selectorName = 'not_size';

  isApplicable() {
    return this._typeWrap.isMany();
  }

  getInputFieldType() {
    return GraphQLInt;
  }

  getTransformInput() {
    const fieldName = this.getFieldName();
    return input => ({
      [fieldName]: { $not: { $size: extractValue(input) } },
    });
  }
}
