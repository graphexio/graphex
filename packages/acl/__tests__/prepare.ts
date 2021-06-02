import QueryExecutor from '@graphex/mongodb-executor';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

const util = require('util');

export default () => {
  let mongod;
  let client: MongoClient;

  return {
    async start() {
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
      return { QE, connectToDatabase };
    },
    async stop() {
      await client.close();
      await mongod.stop();
    },
  };
};
