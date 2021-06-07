import { MongoClient, Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = new MongoMemoryServer({
  binary: {
    version: '4.2.8',
  },
});
mongod.getUri().then(console.log);

let DB: Db;
let Client: MongoClient;

export const getDb = async () => {
  if (Client?.isConnected()) {
    return DB;
  }
  Client = await MongoClient.connect(await mongod.getUri(), {
    useNewUrlParser: true,
  });
  DB = Client.db();
  return DB;
};
