import { GraphQLScalarType, Kind, StringValueNode } from 'graphql';
import gql from 'graphql-tag';
import { ObjectID } from 'mongodb';

export const typeDef = gql`
  scalar ObjectID
`;

export const resolvers = {
  ObjectID: new GraphQLScalarType({
    name: 'ObjectID',
    description: 'MongoDB ObjectID type',
    serialize: (val: ObjectID) => val.toString(),
    parseValue: (val: string) => new ObjectID(val),
    parseLiteral: (ast: StringValueNode) =>
      ast.kind === Kind.STRING ? new ObjectID(ast.value) : ast.value,
  }),
};
