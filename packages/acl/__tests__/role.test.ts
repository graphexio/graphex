import gql from 'graphql-tag';
import AMM from '@apollo-model/core';
import { applyRole } from '../src';
import {
  GraphQLSchema,
  printType,
  execute as graphqlExecute,
  DocumentNode,
  validate,
  print,
} from 'graphql';
import {
  makeRemoteExecutableSchema,
  mergeSchemas,
  introspectSchema,
} from 'graphql-tools';

const createSchema = (typeDefs, options?) => {
  const schema = new AMM({ options }).makeExecutableSchema({
    typeDefs,
  });
  return schema;
};

const intercept = async (schema: GraphQLSchema) => {
  const intercepted = { data: null };
  const fetcher = async (params: any) => {
    intercepted.data = params;
    return null as any;
  };

  const executableSchema = mergeSchemas({
    schemas: [
      makeRemoteExecutableSchema({
        schema: await introspectSchema(
          async ({ query, variables, operationName, context }) => {
            return graphqlExecute(schema, query, null, context, variables);
          }
        ),
        fetcher,
      }),
    ],
  });

  return [executableSchema, intercepted] as const;
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

  return graphqlExecute(schema, document, undefined, {}, variableValues);
};

describe('allow operation', () => {
  const schema = createSchema(gql`
    type Post @model {
      id: ObjectID @id @unique @db(name: "_id")
      title: String
      body: String
    }
  `);

  test('allow read only', () => {
    const aclSchema = applyRole(schema, {
      Post: {
        create: {
          allow: false,
        },
        update: {
          allow: false,
        },
        delete: {
          allow: false,
        },
      },
    });
    expect(printType(aclSchema.getQueryType())).toMatchInlineSnapshot(`
      "type Query {
        posts(where: PostWhereInput, orderBy: PostOrderByInput, offset: Int, first: Int): [Post!]!
        post(where: PostWhereUniqueInput): Post
        postsConnection(where: PostWhereInput, orderBy: PostOrderByInput, offset: Int, first: Int): PostConnection
      }"
    `);
    expect(aclSchema.getMutationType()).toBe(null);
  });

  test('allow read and update', () => {
    const aclSchema = applyRole(schema, {
      Post: {
        create: {
          allow: false,
        },
        update: {
          allow: true,
        },
        delete: {
          allow: false,
        },
      },
    });
    expect(printType(aclSchema.getQueryType())).toMatchInlineSnapshot(`
      "type Query {
        posts(where: PostWhereInput, orderBy: PostOrderByInput, offset: Int, first: Int): [Post!]!
        post(where: PostWhereUniqueInput): Post
        postsConnection(where: PostWhereInput, orderBy: PostOrderByInput, offset: Int, first: Int): PostConnection
      }"
    `);
    expect(printType(aclSchema.getMutationType())).toMatchInlineSnapshot(`
      "type Mutation {
        updatePost(data: PostUpdateInput!, where: PostWhereUniqueInput!): Post
      }"
    `);
  });

  test('allow delete only', () => {
    const aclSchema = applyRole(schema, {
      Post: {
        read: {
          allow: false,
        },
        create: {
          allow: false,
        },
        update: {
          allow: false,
        },
        delete: {
          allow: true,
        },
      },
    });
    expect(aclSchema.getQueryType()).toBe(null);
    expect(printType(aclSchema.getMutationType())).toMatchInlineSnapshot(`
      "type Mutation {
        deletePost(where: PostWhereUniqueInput!): Post
        deletePosts(where: PostWhereInput!): Int!
      }"
    `);
  });
});

describe('allow fields', () => {
  const schema = createSchema(gql`
    type Post @model {
      id: ObjectID @id @unique @db(name: "_id")
      title: String
      body: String
    }
  `);

  test('allow read fields', () => {
    const aclSchema = applyRole(schema, {
      Post: {
        read: {
          fields: {
            title: {
              allow: false,
            },
          },
        },
      },
    });
    expect(printType(aclSchema.getType('Post'))).toMatchInlineSnapshot(`
      "type Post {
        id: ObjectID
        body: String
      }"
    `);
  });

  test('allow update fields', () => {
    const aclSchema = applyRole(schema, {
      Post: {
        update: {
          fields: {
            title: {
              allow: false,
            },
          },
        },
      },
    });
    expect(printType(aclSchema.getType('PostUpdateInput')))
      .toMatchInlineSnapshot(`
      "input PostUpdateInput {
        body: String
      }"
    `);
  });

  test('allow create fields', () => {
    const aclSchema = applyRole(schema, {
      Post: {
        create: {
          fields: {
            title: {
              allow: false,
            },
          },
        },
      },
    });
    expect(printType(aclSchema.getType('PostCreateInput')))
      .toMatchInlineSnapshot(`
      "input PostCreateInput {
        body: String
      }"
    `);
  });
});

describe('filter', () => {
  const schema = createSchema(
    gql`
      type Post @model {
        id: ObjectID @id @unique @db(name: "_id")
        title: String
        body: String
      }
    `,
    { aclWhere: true }
  );

  test('read', async () => {
    const [interceptedSchema, intercepted] = await intercept(schema);

    const aclSchema = applyRole(interceptedSchema, {
      Post: {
        filter: {
          title_contains: 'test',
        },
      },
    });

    await execute(
      aclSchema,
      gql`
        {
          posts {
            id
          }
        }
      `
    );
    expect(print(intercepted.data?.query)).toMatchInlineSnapshot(`
      "query ($_v0_where: PostWhereInput) {
        posts(where: $_v0_where) {
          id
        }
      }
      "
    `);
    expect(intercepted.data?.variables).toMatchInlineSnapshot(`
      Object {
        "_v0_where": Object {
          "aclWhere": Object {
            "title_contains": "test",
          },
        },
      }
      `);
  });
});

describe('hydrate', () => {
  const schema = createSchema(
    gql`
      type Post @model {
        id: ObjectID @id @unique @db(name: "_id")
        title: String
        body: String
        ownerId: Int
      }
    `,
    { aclWhere: true }
  );

  test('create', async () => {
    const [interceptedSchema, intercepted] = await intercept(schema);

    const aclSchema = applyRole(interceptedSchema, {
      Post: {
        create: {
          fields: {
            title: {
              allow: false,
              hydrate: 'test',
            },
          },
        },
      },
    });

    await execute(
      aclSchema,
      gql`
        mutation {
          createPost(data: {}) {
            id
          }
        }
      `
    );
    expect(print(intercepted.data?.query)).toMatchInlineSnapshot(`
    "mutation ($_v0_data: PostCreateInput!) {
      createPost(data: $_v0_data) {
        id
      }
    }
    "
    `);
    expect(intercepted.data?.variables).toMatchInlineSnapshot(`
    Object {
      "_v0_data": Object {
        "title": "test",
      },
    }
    `);
  });

  test('filter and update', async () => {
    const [interceptedSchema, intercepted] = await intercept(schema);

    const aclSchema = applyRole(interceptedSchema, {
      Post: {
        filter: {
          ownerId: 1,
        },
        update: {
          fields: {
            title: {
              allow: false,
              hydrate: 'test',
            },
          },
        },
      },
    });

    await execute(
      aclSchema,
      gql`
        mutation {
          updatePost(where: {}, data: {}) {
            id
          }
        }
      `
    );
    expect(print(intercepted.data?.query)).toMatchInlineSnapshot(`
    "mutation ($_v0_data: PostUpdateInput!, $_v1_where: PostWhereUniqueInput!) {
      updatePost(where: $_v1_where, data: $_v0_data) {
        id
      }
    }
    "
    `);
    expect(intercepted.data?.variables).toMatchInlineSnapshot(`
    Object {
      "_v0_data": Object {
        "title": "test",
      },
      "_v1_where": Object {
        "aclWhere": Object {
          "ownerId": 1,
        },
      },
    }
    `);
  });
});
