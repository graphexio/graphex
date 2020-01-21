import { GraphQLScalarType, Kind, StringValueNode } from 'graphql';
import gql from 'graphql-tag';

export const typeDef = gql`
  scalar Date
`;

export const resolvers = {
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date type',
    serialize: (val: Date) => (val instanceof Date ? val.toISOString() : val),
    parseValue: (val: string) => new Date(val),
    parseLiteral: (ast: StringValueNode) =>
      ast.kind === Kind.STRING ? new Date(ast.value) : ast.value,
  }),
};
