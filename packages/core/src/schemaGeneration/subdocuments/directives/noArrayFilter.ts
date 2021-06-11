import gql from 'graphql-tag';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { AMModelField } from '../../../definitions';

export const typeDef = gql`
  directive @noArrayFilter on FIELD_DEFINITION
`;

class DirectiveNoArrayFilter extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: AMModelField) {
    field.noArrayFilter = true;
  }
}

export const schemaDirectives = {
  noArrayFilter: DirectiveNoArrayFilter,
};
