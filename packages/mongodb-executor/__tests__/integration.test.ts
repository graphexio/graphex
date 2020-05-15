import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import QueryExecutor, { AMDBExecutorOperationType } from '../src/';

let mongod: MongoMemoryServer;
let QE: ReturnType<typeof QueryExecutor>;
let DB: Db = null;

beforeAll(async () => {
  mongod = new MongoMemoryServer();
  const MONGO_URL = await mongod.getConnectionString();
  const MONGO_DB = await mongod.getDbName();

  let client: MongoClient;
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

  QE = QueryExecutor(connectToDatabase);
});

afterAll(async () => {
  mongod.stop();
});

beforeEach(async () => {
  DB.dropDatabase();
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

    const result = await QE({
      type: AMDBExecutorOperationType.AGGREGATE,
      collection: testCollectionName,
      fields: ['aggregate.count'],
    });

    expect(result).toEqual({ aggregate: { count: 4 } });
  });

  test('min,max,sum', async () => {
    const testCollectionName = 'test';
    const testCollection = DB.collection('test');
    await testCollection.insertMany([
      { price: 100 },
      { price: 200 },
      { price: 400 },
      { price: 800 },
    ]);

    const result = await QE({
      type: AMDBExecutorOperationType.AGGREGATE,
      collection: testCollectionName,
      fields: [
        'aggregate.min.price',
        'aggregate.max.price',
        'aggregate.sum.price',
      ],
    });

    expect(result).toEqual({
      aggregate: {
        min: { price: 100 },
        max: { price: 800 },
        sum: { price: 1500 },
      },
    });
  });

  test('min,max,sum nested', async () => {
    const testCollectionName = 'test';
    const testCollection = DB.collection('test');
    await testCollection.insertMany([
      { details: { price: 100 } },
      { details: { price: 200 } },
      { details: { price: 400 } },
      { details: { price: 800 } },
    ]);

    const result = await QE({
      type: AMDBExecutorOperationType.AGGREGATE,
      collection: testCollectionName,
      fields: [
        'aggregate.min.details.price',
        'aggregate.max.details.price',
        'aggregate.sum.details.price',
      ],
    });

    expect(result).toEqual({
      aggregate: {
        min: { details: { price: 100 } },
        max: { details: { price: 800 } },
        sum: { details: { price: 1500 } },
      },
    });
  });
});
