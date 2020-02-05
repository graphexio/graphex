import { defaultObjectFieldVisitorHandler } from '@apollo-model/core/lib/inputTypes/visitorHandlers';
import {
  AMInputField,
  IAMInputFieldFactory,
} from '@apollo-model/core/src/definitions';
import { GraphQLNamedType } from 'graphql';

export const AMGeoJSONCreateFieldFactory: IAMInputFieldFactory = {
  isApplicable(field) {
    return true;
  },
  getFieldName(field) {
    return `${field.name}`;
  },
  getField(field, schemaInfo) {
    return <AMInputField>{
      name: this.getFieldName(field),
      type: schemaInfo.schema.getType(
        `${(field.type as GraphQLNamedType).name}Input`
      ),
      ...defaultObjectFieldVisitorHandler(field.dbName),
    };
  },
};
