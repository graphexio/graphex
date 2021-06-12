import TypeWrap from '@graphex/type-wrap';
import { getNamedType, GraphQLList, isCompositeType } from 'graphql';
import { SelectorOperators } from '@graphex/abstract-datasource-adapter';
import { AMModelField, AMModelType } from '../../../../definitions';
import { AMQuerySelectorFieldFactory } from '../fieldFactories/querySelector';
import { makeArray } from '../fieldFactories/utils';

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
      [SelectorOperators.EXACT]: makeArray(value),
    };
  }
}
