import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import QueryExecutor, { AMDBExecutorOperationType } from '../src/';

let mongod: MongoMemoryServer;
let QE: ReturnType<typeof QueryExecutor>;
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

  QE = QueryExecutor(connectToDatabase);
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

  test('min,max,sum with selector', async () => {
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
      selector: {
        $and: [{ price: { $gt: 150 } }, { price: { $lt: 500 } }],
      },
      fields: [
        'aggregate.min.price',
        'aggregate.max.price',
        'aggregate.sum.price',
      ],
    });

    expect(result).toEqual({
      aggregate: {
        min: { price: 200 },
        max: { price: 400 },
        sum: { price: 600 },
      },
    });
  });

  test('min,max,sum with skip and limit', async () => {
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
      options: {
        skip: 1,
        limit: 2,
      },
      fields: [
        'aggregate.min.price',
        'aggregate.max.price',
        'aggregate.sum.price',
      ],
    });

    expect(result).toEqual({
      aggregate: {
        min: { price: 200 },
        max: { price: 400 },
        sum: { price: 600 },
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

  test('min,max,sum empty collection', async () => {
    const testCollectionName = 'test';
    const testCollection = DB.collection('test');

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
        count: 0,
        max: null,
        min: null,
        sum: null,
      },
    });
  });
});
