import gql from 'graphql-tag';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { AMModelField } from '../../definitions';

export const typeDef = gql`
  directive @unique on FIELD_DEFINITION
`;

class Unique extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: AMModelField) {
    field.isUnique = true;
  }
}

export const schemaDirectives = {
  unique: Unique,
};
