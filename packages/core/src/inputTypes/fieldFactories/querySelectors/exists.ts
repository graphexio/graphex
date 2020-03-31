import TypeWrap from '@apollo-model/type-wrap';
import { GraphQLBoolean } from 'graphql';
import { AMModelField } from '../../../definitions';
import { AMQuerySelectorFieldFactory } from '../querySelector';

export class ExistsSelector extends AMQuerySelectorFieldFactory {
  isApplicable(field: AMModelField) {
    return true;
  }
  getFieldName(field: AMModelField) {
    return `${field.name}_exists`;
  }
  getFieldType(field: AMModelField) {
    return GraphQLBoolean;
  }
  transformValue(value: any) {
    return {
      $exists: value,
    };
  }
}
