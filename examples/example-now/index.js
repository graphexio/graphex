const { ApolloServer } = require('apollo-server-micro');
import ApolloModelMongo, { QueryExecutor } from 'apollo-model-mongodb';
import { MongoClient, ObjectID } from 'mongodb';
import typeDefs from './model.graphql';

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

let schema = new ApolloModelMongo({
  queryExecutor: QueryExecutor(connectToDatabase),
}).makeExecutableSchema({
  typeDefs,
});

let server = new ApolloServer({
  schema,
  introspection: true,
  playground: true,
});

let Handler = server.createHandler({ path: '/' });

module.exports = (req, res) => {
  return Handler(req, res);
};
