import { GraphQLBoolean } from 'graphql';
import QuerySelector from './interface';
import { extractValue, makeArray } from './utils';

export default class ExistsSelector extends QuerySelector {
  _selectorName = 'exists';

  isApplicable() {
    return true;
  }

  getInputFieldType() {
    return GraphQLBoolean;
  }

  getTransformInput() {
    const fieldName = this.getFieldName();
    return input => ({
      [fieldName]: { $exists: extractValue(input) },
    });
  }
}
