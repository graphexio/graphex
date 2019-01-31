import { ApolloServer } from 'apollo-server';
import ApolloModelMongo, { QueryExecutor } from '../src/';
import { MongoClient, ObjectID } from 'mongodb';
import typeDefs from './model.js';

export const CONNECTION = MongoClient.connect(
  process.env.MONGO_URL,
  { useNewUrlParser: true }
);
export const DB = CONNECTION.then(conn => {
  return conn.db(process.env.MONGO_DB);
});

const schema = new ApolloModelMongo({
  queryExecutor: QueryExecutor(DB),
}).makeExecutableSchema({
  typeDefs,
});

export const server = new ApolloServer({
  schema,
  introspection: true,
  playground: true,
});
