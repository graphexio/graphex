import { ApolloServer } from 'apollo-server';
import ApolloModelMongo, { QueryExecutor } from 'apollo-model-mongodb';
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

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
