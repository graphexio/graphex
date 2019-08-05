import { ApolloServer } from 'apollo-server';
import AMM, { QueryExecutor } from '../src/';
import { MongoClient, ObjectID } from 'mongodb';
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

const schema = new AMM({
  queryExecutor: QueryExecutor(connectToDatabase),
}).makeExecutableSchema({
  typeDefs,
});

export const server = new ApolloServer({
  schema,
  introspection: true,
  playground: true,
});
