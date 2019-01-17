import { ApolloServer } from 'apollo-server';
import ApolloModelMongo, { QueryExecutor } from 'apollo-model-mongodb';
import { MongoClient, ObjectID } from 'mongodb';
import typeDefs from './model.js';

let db = MongoClient.connect(
  process.env.MONGO_URL,
  { useNewUrlParser: true }
).then(conn => {
  let db = conn.db(process.env.MONGO_DB);

  const schema = new ApolloModelMongo({
    queryExecutor: QueryExecutor(db),
  }).makeExecutablSchema({
    typeDefs,
  });

  const server = new ApolloServer({
    schema,
    introspection: true,
    playground: true,
  });

  server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
  });
});
