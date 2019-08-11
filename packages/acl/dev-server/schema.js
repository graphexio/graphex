import AMM from '@apollo-model/core';
import QueryExecutor from '@apollo-model/mongodb-executor';
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

export const schema = new AMM({
  queryExecutor: QueryExecutor(connectToDatabase),
}).makeExecutableSchema({
  typeDefs,
});
