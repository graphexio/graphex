import gql from 'graphql-tag';
import { TimestampDirective } from './timestamps';

export const typeDef = gql`
  directive @createdAt on FIELD_DEFINITION
`;

class CreatedAt extends TimestampDirective {
  visitFieldDefinition(field) {}
}

export const schemaDirectives = {
  createdAt: CreatedAt,
};
