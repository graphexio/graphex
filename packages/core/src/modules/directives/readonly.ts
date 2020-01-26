import gql from 'graphql-tag';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { AMModelField } from '../../definitions';

export const typeDef = gql`
  directive @readonly on FIELD_DEFINITION
`;

class ReadOnly extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: AMModelField) {
    field.isReadOnly = true;
  }
}

export const schemaDirectives = {
  readonly: ReadOnly,
};
