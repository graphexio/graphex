import TypeWrap from '@apollo-model/type-wrap';
import { getNamedType, GraphQLList, isCompositeType } from 'graphql';
import { AMModelField, AMModelType } from '../../../definitions';
import { AMQuerySelectorFieldFactory } from '../querySelector';
import { makeArray } from '../utils';

export class ExactSelector extends AMQuerySelectorFieldFactory {
  isApplicable(field: AMModelField) {
    const typeWrap = new TypeWrap(field.type);
    return typeWrap.isMany();
  }
  getFieldName(field: AMModelField) {
    return `${field.name}_exact`;
  }
  getFieldType(field: AMModelField) {
    const namedType = getNamedType(field.type);

    if (!isCompositeType(namedType)) {
      return new GraphQLList(namedType);
    } else {
      return new GraphQLList(
        this.configResolver.resolveInputType(
          namedType as AMModelType,
          this.links.whereClean
        )
      );
    }
  }
  transformValue(value: any) {
    return {
      $eq: makeArray(value),
    };
  }
}
