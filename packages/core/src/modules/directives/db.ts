import gql from 'graphql-tag';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import R from 'ramda';

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
  source[info.fieldName] = R.path(R.split('.', name), source);
  return next();
};

export const schemaDirectives = {
  db: DirectiveDB,
};

export const directiveResolvers = {
  db: DirectiveDBResolver,
};
