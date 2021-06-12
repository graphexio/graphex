import { ApolloServer } from 'apollo-server';
import AMM from '../src';
import { createMongoAdapter } from '@graphex/mongodb-adapter';
import { connect, MongoClient } from 'mongodb';
import typeDefs from './model';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as DirectiveImplements from '@graphex/directive-implements';
import { AMOptions } from '../src/definitions';
import { createTestClient } from 'apollo-server-testing';

export default () => {
  let mongod;
  let client: MongoClient;

  return {
    async start(options?: AMOptions) {
      mongod = new MongoMemoryServer();
      const MONGO_URL = await mongod.getUri();
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

      const schema = new AMM({
        modules: [DirectiveImplements],
        options,
      }).buildFederatedSchema({
        resolverValidationOptions: {
          requireResolversForResolveType: false,
        },
        typeDefs,
      });

      const server = new ApolloServer({
        schema,
        context: async () => {
          const adapter = createMongoAdapter(await connectToDatabase());
          return {
            adapter,
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
