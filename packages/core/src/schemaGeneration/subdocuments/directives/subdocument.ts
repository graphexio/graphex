import gql from 'graphql-tag';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { AMModelField } from '../../../definitions';

export const typeDef = gql`
  directive @subdocument on FIELD_DEFINITION
`;

class Subdocument extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: AMModelField) {
    field.isSubdocument = true;
  }
}

export const schemaDirectives = {
  subdocument: Subdocument,
};
