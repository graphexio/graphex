import { ApolloServer } from 'apollo-server';
import ApolloModelMongo from '@graphex/core';
import QueryExecutor from '@graphex/mongodb-executor';
import { MongoClient } from 'mongodb';
import typeDefs from './model.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

import {
  allMutations,
  modelDefaultActions,
  allQueries,
  anyField,
  applyRules,
  modelField,
  allACLTypes,
  modelDefault,
} from '@graphex/acl';

const mongod = new MongoMemoryServer();

let DB = null;

export const connectToDatabase = async () => {
  if (DB && DB.serverConfig.isConnected()) {
    return DB;
  }
  return MongoClient.connect(await mongod.getUri(), {
    useNewUrlParser: true,
  }).then((client) => {
    DB = client.db(process.env.MONGO_DB);
    return DB;
  });
};

const schema = new ApolloModelMongo({
  options: { aclWhere: true },
}).makeExecutableSchema({
  typeDefs,
});

// const server = new ApolloServer({
//   schema,
//   introspection: true,
//   playground: true,
//   context: () => ({
//     queryExecutor: QueryExecutor(connectToDatabase),
//   }),
// });

// server.listen().then(({ url }) => {
//   console.log(`🚀  Server ready at ${url}`);
// });

// ACL

const aclSchema = applyRules(schema, {
  allow: [
    modelDefaultActions('Category', 'CRU'), //
    anyField,
  ],
  deny: [
    allACLTypes, //for aclWhere
    modelField('Category', 'subcategories', 'CRU'),
    modelField('Category', 'subcategoriesConnection', 'CRU'),
  ],
  defaults: [
    modelDefault('Category', 'aclWhere', 'R', ({ context }) => {
      return { parentCategory: { title: 'root' } };
    }),
  ],
  argsDefaults: [
    // set empty where arg
    (schema) => ({
      cond: modelDefaultActions('Category', 'RUD')(schema),
      fn: () => ({ where: {} }),
    }),
  ],
});

const aclServer = new ApolloServer({
  schema: aclSchema,
  introspection: true,
  playground: true,
  context: () => ({
    queryExecutor: QueryExecutor(connectToDatabase),
  }),
});

aclServer.listen({ port: 4000 }).then(({ url }) => {
  console.log(`🚀  ACL Server ready at ${url}`);
});
