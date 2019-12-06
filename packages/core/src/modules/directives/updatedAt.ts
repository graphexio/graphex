import gql from 'graphql-tag';
import { TimestampDirective } from './timestamps';

export const typeDef = gql`
  directive @updatedAt on FIELD_DEFINITION
`;

class UpdatedAt extends TimestampDirective {
  visitFieldDefinition(field) {}
}

export const schemaDirectives = {
  updatedAt: UpdatedAt,
};
