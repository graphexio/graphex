import { GraphQLScalarType } from 'graphql';
import gql from 'graphql-tag';
import { ObjectID } from 'mongodb';

export default new GraphQLScalarType({
  name: 'ObjectID',
  description: 'MongoDB ObjectID type',
  serialize: val => val.toString(),
  parseValue: val => ObjectID(val),
  parseLiteral: ast => ObjectID(ast.value),
});

export const typeDef = gql`
  scalar ObjectID
`;
