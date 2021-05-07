import { ApolloServer } from 'apollo-server';
import ApolloModelMongo from '@apollo-model/core';
import QueryExecutor from '@apollo-model/mongodb-executor';
import { MongoClient } from 'mongodb';
import typeDefs from './model.js';

let DB = null;

export const connectToDatabase = () => {
  if (DB && DB.serverConfig.isConnected()) {
    return Promise.resolve(DB);
  }
  return MongoClient.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
  }).then(client => {
    DB = client.db(process.env.MONGO_DB);
    return DB;
  });
};

const schema = new ApolloModelMongo().makeExecutableSchema({
  typeDefs,
});

const server = new ApolloServer({
  schema,
  introspection: true,
  playground: true,
  context: () => ({
    queryExecutor: QueryExecutor(connectToDatabase),
  }),
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
