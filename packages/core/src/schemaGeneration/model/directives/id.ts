import gql from 'graphql-tag';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { AMModelField } from '../../../definitions';

export const typeDef = gql`
  directive @id on FIELD_DEFINITION
`;

class ID extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: AMModelField) {
    field.isID = true;
  }
}

export const schemaDirectives = {
  id: ID,
};
