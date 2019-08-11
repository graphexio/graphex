const { ApolloServer, gql } = require('apollo-server');
const { buildFederatedSchema } = require('@apollo/federation');

import FilterFields from '../src/';

const { transformSchema } = require('graphql-tools');
// console.log({ tools });
//
// console.log(FilterTypes);

const typeDefs = gql`
  extend type Query {
    me: User
  }

  interface Node {
    id: ID!
  }

  interface Timestamp {
    updatedAt: Int!
  }

  type User implements Node & Timestamp {
    id: ID!
    name: String
    username: String
    nextUser: User
    updatedAt: Int!
  }

  input CreateUser {
    id: ID!
    name: String!
    username: String!
    age: Int
    height: [Float]
    nextUser: Test!
  }

  input Test {
    id: ID!
    test: Test2!
  }

  input Test2 {
    id: ID!
    test: String
  }

  extend type Mutation {
    createUser(data: CreateUser!): User
  }
`;

const resolvers = {
  Query: {
    me() {
      return users[0];
    },
  },
  Mutation: {
    createUser(obj, { data }) {
      console.log(data);
      return data;
    },
  },
  // User: {
  //   __resolveReference(object) {
  //     return users.find(user => user.id === object.id);
  //   }
  // }
};

let schema = buildFederatedSchema([
  {
    typeDefs,
    resolvers,
  },
]);

let filterFields = FilterFields(
  (type, field) => {
    return !/^.*\.id$/.test(`${type.name}.${field.name}`);
  },
  (type, field) => {
    if (/.*\.id/.test(`${type.name}.${field.name}`)) {
      return () => null;
    }
  }
);

schema = transformSchema(schema, [filterFields]);

const server = new ApolloServer({
  schema,
});

server.listen({ port: 4005 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

const users = [
  {
    id: '1',
    name: 'Ada Lovelace',
    birthDate: '1815-12-10',
    username: '@ada',
  },
  {
    id: '2',
    name: 'Alan Turing',
    birthDate: '1912-06-23',
    username: '@complete',
  },
];
