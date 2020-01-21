import {
  execute as graphqlExecute,
  printSchema,
  GraphQLSchema,
  DocumentNode,
  validate,
} from 'graphql';
import gql from 'graphql-tag';

import {
  applyRules,
  allQueries,
  allMutations,
  allACLTypes,
  anyField,
  modelDefault,
  modelField,
  regexFields,
  modelDefaultActions,
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

const QE = QueryExecutor(connectToDatabase);

const createSchema = (typeDefs, options?) => {
  const schema = new AMM({ options }).makeExecutableSchema({
    typeDefs,
  });
  return schema;
};

const execute = (
  schema: GraphQLSchema,
  document: DocumentNode,
  variableValues?: { [key: string]: any }
) => {
  const errors = validate(schema, document);
  if (errors.length > 0) throw new Error(errors.toString());

  return graphqlExecute(
    schema,
    document,
    undefined,
    {
      queryExecutor: async params => {
        // console.log(util.inspect(params, { showHidden: false, depth: null }));
        // console.log(params);
        let result = await QE(params);
        // console.log('result', result);
        return result;
      },
    },
    variableValues
  );
};

describe('accessRules', () => {
  jest.setTimeout(10000);

  afterEach(async () => {
    let DB = await connectToDatabase();
    DB.dropDatabase();
  });

  afterAll(async () => {
    // mongod.stop();
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

    const DEFAULT_BODY = 'TEST DEFAULT BODY';
    let aclSchema = applyRules(schema, {
      allow: [allQueries, allMutations, anyField],
      deny: [modelField('Post', 'body', 'C')],
      defaults: [modelDefault('Post', 'body', 'C', () => DEFAULT_BODY)],
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

    expect(createResult.errors).toBeUndefined();
    const createdPost = createResult.data.createPost;

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
      { id: createdPost.id }
    );
    expect(readResult.errors).toBeUndefined();
    const readedPost = readResult.data.post;

    expect(readedPost.body).toEqual(DEFAULT_BODY);
  });

  it('relation default', async () => {
    const schema = createSchema(gql`
      type Post @model {
        id: ObjectID @id @unique @db(name: "_id")
        title: String
        body: String
        user: User @relation
      }

      type User @model {
        id: ObjectID @id @unique @db(name: "_id")
        username: String
      }
    `);

    const USERNAME = 'admin';

    const createUserResult = await execute(
      schema,
      gql`
        mutation createUser($username: String) {
          createUser(data: { username: $username }) {
            id
            username
          }
        }
      `,
      { username: USERNAME }
    );
    const createdUser = createUserResult.data.createUser;

    let aclSchema = applyRules(schema, {
      allow: [allQueries, allMutations, anyField],
      deny: [modelField('Post', 'user', 'C')],
      defaults: [
        modelDefault('Post', 'user', 'C', () => ({
          connect: { id: createdUser.id },
        })),
      ],
    });

    let createResult = await execute(
      aclSchema,
      gql`
        mutation {
          createPost(data: { title: "TEST TITLE" }) {
            id
            title
            user {
              id
              username
            }
          }
        }
      `
    );
    const createdPost = createResult.data.createPost;

    let readResult = await execute(
      aclSchema,
      gql`
        query read($id: ObjectID) {
          post(where: { id: $id }) {
            id
            title
            user {
              username
            }
          }
        }
      `,
      { id: createdPost.id }
    );

    const readedPost = readResult.data.post;

    expect(readedPost.user).toBeTruthy();
    expect(readedPost.user.username).toEqual(USERNAME);
  });

  it('relation default read', async () => {
    const schema = createSchema(
      gql`
        type Post @model {
          id: ObjectID @id @unique @db(name: "_id")
          title: String
          body: String
          user: User @relation
        }

        type User @model {
          id: ObjectID @id @unique @db(name: "_id")
          username: String
        }
      `,
      { aclWhere: true }
    );

    const USERNAME = 'admin';

    const createUserResult = await execute(
      schema,
      gql`
        mutation {
          createUser(data: { username: "admin1" }) {
            id
            username
          }
          createPost(
            data: { title: "Title", user: { create: { username: "admin2" } } }
          ) {
            title
            user {
              id
              username
            }
          }
        }
      `,
      {}
    );
    expect(createUserResult.errors).toBeUndefined();
    const user1 = createUserResult.data.createUser;
    const user2 = createUserResult.data.createPost.user;

    //default aclWhere = user1 => no items
    {
      let aclSchema = applyRules(schema, {
        allow: [allQueries, allMutations, anyField],
        deny: [allACLTypes, modelField('Post', 'user', 'CR')],
        defaults: [
          modelDefault('Post', 'user', 'R', () => ({
            id: user1.id,
          })),
        ],
        argsDefaults: [
          {
            cond: modelDefaultActions('Post', 'CRU'),
            fn: () => ({ aclWhere: { user: { id: user1.id } } }),
          },
        ],
      });

      let readResult = await execute(
        aclSchema,
        gql`
          query {
            posts {
              title
            }
          }
        `
      );

      expect(readResult.errors).toBeUndefined();
      expect(readResult.data).toMatchInlineSnapshot(`
      Object {
        "posts": Array [],
      }
    `);
    }

    //default aclWhere = user2 => one item
    {
      let aclSchema = applyRules(schema, {
        allow: [allQueries, allMutations, anyField],
        deny: [allACLTypes, modelField('Post', 'user', 'CR')],
        defaults: [
          modelDefault('Post', 'user', 'R', () => ({
            id: user1.id,
          })),
        ],
        argsDefaults: [
          {
            cond: modelDefaultActions('Post', 'CRU'),
            fn: () => ({ aclWhere: { user: { id: user2.id } } }),
          },
        ],
      });

      let readResult = await execute(
        aclSchema,
        gql`
          query {
            posts {
              title
            }
          }
        `
      );

      expect(readResult.errors).toBeUndefined();
      expect(readResult.data).toMatchInlineSnapshot(`
        Object {
          "posts": Array [
            Object {
              "title": "Title",
            },
          ],
        }
      `);
    }
  });

  it('default inside removed type', async () => {
    const schema = createSchema(gql`
      type Post @model {
        id: ObjectID @id @unique @db(name: "_id")
        title: String
        meta: Meta!
      }

      type Meta @embedded {
        slug: String!
        keywords: [String]
      }
    `);

    const SLUG = 'test_slug';

    let aclSchema = applyRules(schema, {
      allow: [allQueries, allMutations, anyField],
      deny: [
        modelField('Meta', 'slug', 'CRUD'),
        modelField('Meta', 'keywords', 'CRUD'),
      ],
      defaults: [
        modelDefault('Meta', 'slug', 'C', () => SLUG),
        modelDefault('Post', 'meta', 'C', () => ({ create: { slug: SLUG } })),
      ],
    });
    // console.log(printSchema(schema));

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

    const createdPost = createResult.data.createPost;

    let readResult = await execute(
      schema,
      gql`
        query read($id: ObjectID) {
          post(where: { id: $id }) {
            id
            title
            meta {
              slug
              keywords
            }
          }
        }
      `,
      { id: createdPost.id }
    );

    const readedPost = readResult.data.post;
    expect(readResult.errors).toBeUndefined();
    expect(readedPost.meta).toBeTruthy();
    expect(readedPost.meta.slug).toEqual(SLUG);
  });
});
