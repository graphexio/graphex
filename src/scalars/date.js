import { GraphQLScalarType, Kind } from 'graphql';
import gql from 'graphql-tag';

export const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date type',
  serialize: val => (val instanceof Date ? val.toISOString() : val),
  parseValue: val => new Date(val),
  parseLiteral: ast =>
    ast.kind === Kind.STRING ? new Date(ast.value) : ast.value,
});

export const DateSchema = gql`
  scalar Date
`;
