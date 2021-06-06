import gql from 'graphql-tag';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { AMModelField } from '../../definitions';

export const typeDef = gql`
  directive @relationOutside on FIELD_DEFINITION
`;

export class RelationOutsideDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: AMModelField) {
    field.isRelationOutside = true;
  }
}

export const schemaDirectives = {
  relationOutside: RelationOutsideDirective,
};
