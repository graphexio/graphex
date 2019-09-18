import { execute, printSchema } from 'graphql';
import gql from 'graphql-tag';

import {
  applyRules,
  allQueries,
  allMutations,
  anyField,
  modelDefault,
} from '../src';

import AMM from '@apollo-model/core';
import QueryExecutor from '@apollo-model/mongodb-executor';
import { MongoClient, ObjectID } from 'mongodb';
import typeDefs from './__fixtures__/model.js';

import MongoMemoryServer from 'mongodb-memory-server';

export const mongod = new MongoMemoryServer();
const uri = mongod.getConnectionString();
const dbName = mongod.getDbName();

let DB = null;

export const connectToDatabase = () => {
  if (DB && DB.serverConfig.isConnected()) {
    return Promise.resolve(DB);
  }
  return Promise.all([uri, dbName]).then(([uri, dbName]) =>
    MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then(client => {
      DB = client.db(dbName);
      return DB;
    })
  );
};

const createSchema = typeDefs => {
  const schema = new AMM({
    queryExecutor: QueryExecutor(connectToDatabase),
  }).makeExecutableSchema({
    typeDefs,
  });
  return schema;
};

describe('accessRules', () => {
  jest.setTimeout(10000);

  afterEach(async () => {
    let DB = await connectToDatabase();
    DB.dropDatabase();
  });

  afterAll(async () => {
    mongod.stop();
  });

  it('wildcard', async () => {
    const schema = createSchema(gql`
      type Post @model {
        id: ObjectID @id @unique @db(name: "_id")
        title: String
        body: String
      }
    `);

    let aclSchema = applyRules(schema, {
      allow: [allQueries, allMutations, anyField],
    });

    let result = await execute(
      aclSchema,
      gql`
        mutation {
          createPost(data: { title: "TEST TITLE", body: "TEST BODY" }) {
            id
          }
        }
      `
    );
  });

  it('simple default', async () => {
    const schema = createSchema(gql`
      type Post @model {
        id: ObjectID @id @unique @db(name: "_id")
        title: String
        body: String
      }
    `);

    const DEFAULT_BODY = 'DEFAULT BODY';
    let aclSchema = applyRules(schema, {
      allow: [allQueries, allMutations, anyField],
      defaults: [modelDefault('Post', 'C', () => DEFAULT_BODY)],
    });

    let createResult = await execute(
      aclSchema,
      gql`
        mutation {
          createPost(data: { title: "TEST TITLE" }) {
            id
            title
          }
        }
      `
    );
    const aclPost = createResult.data.createPost;

    let readResult = await execute(
      aclSchema,
      gql`
        query read($id: ObjectID) {
          post(where: { id: $id }) {
            id
            title
            body
          }
        }
      `,
      null,
      null,
      { id: aclPost.id }
    );

    const realPost = readResult.data.post;

    expect(realPost.body).toEqual(DEFAULT_BODY);
  });
});
