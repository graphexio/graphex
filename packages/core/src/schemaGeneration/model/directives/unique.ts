import gql from 'graphql-tag';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { AMModelField } from '../../../definitions';

export const typeDef = gql`
  directive @unique on FIELD_DEFINITION
`;

class Unique extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: AMModelField, { objectType }) {
    field.isUnique = true;

    objectType.mmUniqueFields = objectType.mmUniqueFields ?? [];
    objectType.mmUniqueFields.push(field);
  }
}

export const schemaDirectives = {
  unique: Unique,
};
