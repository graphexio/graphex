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

  type User {
    id: ID!
    name: String
    username: String
    nextUser: User
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
    return !/Test\.test/.test(`${type.name}.${field.name}`);
  },
  (type, field) => {
    if (/Test\.test/.test(`${type.name}.${field.name}`)) {
      return () => ({
        id: '123',
      });
    }
  }
);

schema = transformSchema(schema, [filterFields]);

const server = new ApolloServer({
  schema,
});

server.listen({ port: 4001 }).then(({ url }) => {
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
