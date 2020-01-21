import gql from 'graphql-tag';
import { SchemaDirectiveVisitor } from 'graphql-tools';

export const typeDef = gql`
  directive @db(name: String!, defaultValue: String = null) on FIELD_DEFINITION
`;

class DirectiveDB extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { name } = this.args;
    field.dbName = name;
  }
}

const DirectiveDBResolver = (next, source, args, ctx, info) => {
  const { name } = args;
  info.fieldName = name;
  return next();
};

export const schemaDirectives = {
  db: DirectiveDB,
};

export const directiveResolvers = {
  db: DirectiveDBResolver,
};
