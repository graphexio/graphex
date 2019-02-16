import { GraphQLScalarType, Kind } from 'graphql';
import gql from 'graphql-tag';

export const typeDef = gql`
  scalar JSON
`;

export const resolvers = {
  JSON: new GraphQLScalarType({
    name: 'JSON',
    description: 'JSON Scalar. returns ',
    serialize: val => JSON.stringify(val),
    parseValue: val => JSON.parse(val),
    parseLiteral: ast => {
      try {
        return JSON.parse(ast.value);
      } catch (e) {
        return ast.value;
      }
    },
  }),
};
