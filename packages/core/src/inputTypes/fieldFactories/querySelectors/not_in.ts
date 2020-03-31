import {
  getNamedType,
  GraphQLList,
  isCompositeType,
  isEnumType,
} from 'graphql';
import { AMModelField, AMModelType } from '../../../definitions';
import { AMQuerySelectorFieldFactory } from '../querySelector';
import { makeArray } from '../utils';

export class NotInSelector extends AMQuerySelectorFieldFactory {
  isApplicable(field: AMModelField) {
    const namedType = getNamedType(field.type);
    return (
      isCompositeType(namedType) ||
      ['ID', 'ObjectID', 'Int', 'Float', 'String'].includes(
        namedType.toString()
      )
    );

    //TODO: fix
    // const namedType = getNamedType(field.type);
    // return (
    //   (isCompositeType(namedType) ||
    //     isEnumType(namedType) ||
    //     ['ID', 'ObjectID', 'Int', 'Float', 'String'].includes(
    //       namedType.toString()
    //     )) &&
    //   !field.relation
    // );
  }
  getFieldName(field: AMModelField) {
    return `${field.name}_not_in`;
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
      $not: { $in: makeArray(value) },
    };
  }
}
