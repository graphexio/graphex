import { defaultFieldResolver } from 'graphql';
import { SchemaDirectiveVisitor } from 'graphql-tools';

export const ReadOnlyScheme = `directive @readOnly on FIELD_DEFINITION`;

export default class ReadOnly extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    field.skipCreate = true;
  }
}
