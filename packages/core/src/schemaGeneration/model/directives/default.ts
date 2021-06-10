import gql from 'graphql-tag';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { AMModelField } from '../../../definitions';

export const typeDef = gql`
  scalar DefaultValueType
  directive @default(value: DefaultValueType) on FIELD_DEFINITION
`;

class Default extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: AMModelField) {
    field.defaultValue = this.args.value;
  }
}

export const schemaDirectives = {
  default: Default,
};
