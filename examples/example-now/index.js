import { ApolloServer } from 'apollo-server';
import makeExecutablSchema, { QueryExecutor } from 'apollo-model-mongodb';
import { MongoClient, ObjectID } from 'mongodb';
import typeDefs from './model.graphql';

let db = null;
let QE = null;
const queryExecutor = async params => {
  if (!QE) {
    db = await MongoClient.connect(
      process.env.MONGO_URL,
      { useNewUrlParser: true }
    ).then(conn => conn.db(process.env.MONGO_DB));

    QE = QueryExecutor(db);
  }

  return QE(params);
};

const schema = makeExecutablSchema(
  {
    typeDefs,
  },
  { queryExecutor }
);

const server = new ApolloServer({
  schema,
  introspection: true,
  playground: true,
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
