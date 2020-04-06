import AMM from '@apollo-model/core';
import {
  DocumentNode,
  execute as graphqlExecute,
  GraphQLSchema,
  validate,
} from 'graphql';
import gql from 'graphql-tag';
import {
  allACLTypes,
  allMutations,
  allQueries,
  anyField,
  applyRules,
  modelDefault,
  modelDefaultActions,
  modelField,
} from '../src';
import Prepare from './prepare';

const testInstance = Prepare();
let QE, connectToDatabase;

beforeAll(async () => {
  const instance = await testInstance.start();
  QE = instance.QE;
  connectToDatabase = instance.connectToDatabase;
});

afterAll(async () => {
  await testInstance.stop();
});

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
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return graphqlExecute(
    schema,
    document,
    undefined,
    {
      queryExecutor: async params => {
        // console.log(util.inspect(params, { showHidden: false, depth: null }));
        // console.log(params);
        const result = await QE(params);
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
    const DB = await connectToDatabase();
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

    const aclSchema = applyRules(schema, {
      allow: [allQueries, allMutations, anyField],
    });

    const result = await execute(
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
    const aclSchema = applyRules(schema, {
      allow: [allQueries, allMutations, anyField],
      deny: [modelField('Post', 'body', 'C')],
      defaults: [
        modelDefault('Post', 'body', 'C', ({ context }) => {
          expect(context).toBeDefined();
          return DEFAULT_BODY;
        }),
      ],
    });

    const createResult = await execute(
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

    const readResult = await execute(
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

    const aclSchema = applyRules(schema, {
      allow: [allQueries, allMutations, anyField],
      deny: [modelField('Post', 'user', 'C')],
      defaults: [
        modelDefault('Post', 'user', 'C', () => ({
          connect: { id: createdUser.id },
        })),
      ],
    });

    const createResult = await execute(
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

    const readResult = await execute(
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

        type Group @model {
          id: ObjectID @id @unique @db(name: "_id")
          posts: [Post] @relation
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
            id
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
    const postId = createUserResult.data.createPost.id;

    //default aclWhere = user1 => no items
    {
      const aclSchema = applyRules(schema, {
        allow: [allQueries, allMutations, anyField],
        deny: [allACLTypes, modelField('Post', 'user', 'CR')],
        defaults: [
          modelDefault('Post', 'aclWhere', 'R', () => {
            return {
              user: { id: user1.id },
            };
          }),
        ],
        argsDefaults: [
          schema => ({
            cond: modelDefaultActions('Post', 'RUD')(schema),
            fn: () => ({ where: {} }),
          }),
        ],
      });

      const readResult = await execute(
        aclSchema,
        gql`
          query($postId: ObjectID) {
            post(where: { id: $postId }) {
              title
            }
          }
        `,
        { postId }
      );

      expect(readResult.errors).toBeUndefined();
      expect(readResult.data).toMatchInlineSnapshot(`
        Object {
          "post": null,
        }
      `);
    }

    //default aclWhere = user2 => one item
    {
      const aclSchema = applyRules(schema, {
        allow: [allQueries, allMutations, anyField],
        deny: [allACLTypes, modelField('Post', 'user', 'CR')],
        defaults: [
          modelDefault('Post', 'aclWhere', 'R', () => {
            return {
              user: { id: user2.id },
            };
          }),
        ],
      });

      //simple read
      {
        const readResult = await execute(
          aclSchema,
          gql`
            query($postId: ObjectID) {
              post(where: { id: $postId }) {
                title
              }
            }
          `,
          { postId }
        );

        expect(readResult.errors).toBeUndefined();
        expect(readResult.data).toMatchInlineSnapshot(`
        Object {
          "post": Object {
            "title": "Title",
          },
        }
      `);
      }

      //connect
      {
        const readResult = await execute(
          aclSchema,
          gql`
            mutation($postId: ObjectID!) {
              createGroup(data: { posts: { connect: [{ id: $postId }] } }) {
                posts {
                  title
                }
              }
            }
          `,
          { postId }
        );

        expect(readResult.errors).toBeUndefined();
        expect(readResult.data).toMatchInlineSnapshot(`
          Object {
            "createGroup": Object {
              "posts": Array [
                Object {
                  "title": "Title",
                },
              ],
            },
          }
      `);
      }
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

    const aclSchema = applyRules(schema, {
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

    const createResult = await execute(
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

    const readResult = await execute(
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
