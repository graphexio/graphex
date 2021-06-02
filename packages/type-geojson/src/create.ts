import {
  AMInputFieldFactory,
  defaultObjectFieldVisitorHandler,
  AMModelField,
} from '@graphex/core';
import { GraphQLInputType, GraphQLNamedType } from 'graphql';

export class AMGeoJSONCreateFieldFactory extends AMInputFieldFactory {
  isApplicable() {
    return true;
  }
  getFieldName(field: AMModelField) {
    return `${field.name}`;
  }
  getField(field: AMModelField) {
    return {
      name: this.getFieldName(field),
      type: this.schemaInfo.schema.getType(
        `${(field.type as GraphQLNamedType).name}Input`
      ) as GraphQLInputType,
      extensions: undefined,
      ...defaultObjectFieldVisitorHandler(field.dbName),
    };
  }
}
