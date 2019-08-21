import { ApolloServer, gql } from 'apollo-server';

const typeDefs = gql`
  type Query {
    help: String
  }
`;

const resolvers = {
  Query: {
    help: () =>
      'You should send accessToken with request headers to get available methods',
  },
};

let server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true,
});

server.listen(4002).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
