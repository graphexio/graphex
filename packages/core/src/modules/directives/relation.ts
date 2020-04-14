import gql from 'graphql-tag';
import { SchemaDirectiveVisitor } from 'graphql-tools';

export const typeDef = gql`
  directive @relation(
    field: String = "_id"
    storeField: String = null
  ) on FIELD_DEFINITION
`;

export class RelationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition() {
    return;
  }
}

export const schemaDirectives = {
  relation: RelationDirective,
};
