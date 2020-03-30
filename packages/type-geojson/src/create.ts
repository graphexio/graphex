import {
  AMInputField,
  AMInputFieldFactory,
  defaultObjectFieldVisitorHandler,
} from '@apollo-model/core';
import { GraphQLNamedType } from 'graphql';

export class AMGeoJSONCreateFieldFactory extends AMInputFieldFactory {
  isApplicable(field) {
    return true;
  }
  getFieldName(field) {
    return `${field.name}`;
  }
  getField(field) {
    return <AMInputField>{
      name: this.getFieldName(field),
      type: this.schemaInfo.schema.getType(
        `${(field.type as GraphQLNamedType).name}Input`
      ),
      ...defaultObjectFieldVisitorHandler(field.dbName),
    };
  }
}
