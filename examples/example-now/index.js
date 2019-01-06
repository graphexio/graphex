const { ApolloServer } = require('apollo-server-micro');
import ApolloModelMongo, { QueryExecutor } from 'apollo-model-mongodb';
import { MongoClient, ObjectID } from 'mongodb';
import typeDefs from './model.graphql';

console.time('init db connection');
let HANDLER = MongoClient.connect(
  process.env.MONGO_URL,
  { useNewUrlParser: true }
)
  .then(conn => conn.db(process.env.MONGO_DB))
  .then(db => {
    console.timeEnd('init db connection');
    console.time('build server');
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

    let handler = server.createHandler();
    console.timeEnd('build server');
    return handler;
  });

module.exports = async (req, res) => {
  let handler = await HANDLER;
  console.time('execute');
  await handler(req, res);
  console.timeEnd('execute');
};
