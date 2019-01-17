const { ApolloServer } = require('apollo-server-micro');
import ApolloModelMongo, { QueryExecutor } from 'apollo-model-mongodb';
import { MongoClient, ObjectID } from 'mongodb';
import typeDefs from './model.graphql';

let HANDLER = MongoClient.connect(
  process.env.MONGO_URL,
  { useNewUrlParser: true }
)
  .then(conn => conn.db(process.env.MONGO_DB))
  .then(db => {
    return new ApolloModelMongo({
      queryExecutor: QueryExecutor(db),
    }).makeExecutablSchema({
      typeDefs,
    });
  })
  .then(schema => {
    let server = new ApolloServer({
      schema,
      introspection: true,
      playground: true,
    });

    let handler = server.createHandler({ path: '/' });
    return handler;
  });

module.exports = async (req, res) => {
  let handler = await HANDLER;
  await handler(req, res);
};
