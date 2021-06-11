import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { createMongoAdapter, DataSourceAdapter } from '../src/';

let mongod: MongoMemoryServer;
let Adapter: DataSourceAdapter;
let DB: Db = null;
let client: MongoClient;

beforeAll(async () => {
  mongod = new MongoMemoryServer();
  const MONGO_URL = await mongod.getConnectionString();
  const MONGO_DB = await mongod.getDbName();

  const connectToDatabase = async () => {
    if (DB && client.isConnected()) {
      return DB;
    }
    client = await MongoClient.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    DB = await client.db(MONGO_DB);
    return DB;
  };
  await connectToDatabase();

  Adapter = createMongoAdapter(await connectToDatabase());
});

afterAll(async () => {
  await client.close();
  await mongod.stop();
});

beforeEach(async () => {
  await DB.dropDatabase();
});

describe('aggregation', () => {
  test('count', async () => {
    const testCollectionName = 'test';
    const testCollection = DB.collection('test');
    await testCollection.insertMany([
      { price: 100 },
      { price: 200 },
      { price: 400 },
      { price: 800 },
    ]);

    const result = await Adapter.aggregate({
      collectionName: testCollectionName,
    });

    expect(result).toEqual([{ count: 4 }]);
  });
});
