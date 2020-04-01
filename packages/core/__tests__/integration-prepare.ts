import { ApolloServer } from 'apollo-server';
import AMM from '../src';
import QueryExecutor from '@apollo-model/mongodb-executor';
import { MongoClient, ObjectID } from 'mongodb';
import typeDefs from './model';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as DirectiveImplements from '@apollo-model/directive-implements';
import { AMOptions } from '../src/definitions';
const util = require('util');

export default () => {
  let mongod;
  let client: MongoClient;

  return {
    async start(options?: AMOptions) {
      mongod = new MongoMemoryServer();
      const MONGO_URL = await mongod.getConnectionString();
      const MONGO_DB = await mongod.getDbName();

      let DB = null;

      const connectToDatabase = async () => {
        if (DB && DB.serverConfig.isConnected()) {
          return DB;
        }
        client = await MongoClient.connect(MONGO_URL, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        DB = await client.db(MONGO_DB);
        return DB;
      };

      const QE = QueryExecutor(connectToDatabase);

      const schema = new AMM({
        modules: [DirectiveImplements],
      }).buildFederatedSchema({
        resolverValidationOptions: {
          requireResolversForResolveType: false,
        },
        typeDefs,
      });

      const server = new ApolloServer({
        schema,
        context: () => {
          return {
            queryExecutor: async params => {
              // console.log(util.inspect(params, { showHidden: false, depth: null }));
              // console.log(params);
              const result = await QE(params);
              // console.log('result', result);
              return result;
            },
          };
        },
        introspection: true,
        playground: true,
        formatError: error => {
          // console.log(error);
          // console.dir(error.extensions);
          return error;
        },
      });

      const { createTestClient } = require('apollo-server-testing');
      const { query, mutate } = createTestClient(server);
      return {
        query,
        mutate,
        connectToDatabase,
        mongod,
      };
    },
    async stop() {
      await client.close();
      await mongod.stop();
    },
  };
};
