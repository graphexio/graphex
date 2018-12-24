import { defaultFieldResolver } from 'graphql';
import { SchemaDirectiveVisitor } from 'graphql-tools';

export const UniqueScheme = `directive @unique on FIELD_DEFINITION`;

export default class Unique extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    field.unique = true;
  }
}
