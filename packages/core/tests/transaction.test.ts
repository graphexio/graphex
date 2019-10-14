import * as DirectiveImplements from '@apollo-model/directive-implements';
import gql from 'graphql-tag';
import AMM from '../src';
import { applyInputTransform } from '../src/inputTypes/utils';
import { AMVisitor } from '../src/execution/visitor';
import { AMTransaction } from '../src/execution/transaction';
import { UserInputError } from 'apollo-server';

const generateSchema = typeDefs => {
  return new AMM({
    queryExecutor: null,
  }).makeExecutableSchema({
    resolverValidationOptions: {
      requireResolversForResolveType: false,
    },
    typeDefs: [typeDefs, DirectiveImplements.typeDefs],
    schemaDirectives: {
      ...DirectiveImplements.schemaDirectives,
    },
  });
};

describe('simple schema', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
    }
  `);

  test('multiple query', () => {
    const rq = gql`
      {
        posts {
          id
          title
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);
    expect(transaction).toMatchInlineSnapshot(`
          Object {
            "operations": Array [
              Object {
                "collectionName": "posts",
                "fieldsSelection": Object {
                  "fields": Array [
                    "_id",
                    "title",
                  ],
                },
                "identifier": "Operation-0",
                "kind": "AMReadOperation",
                "many": true,
                "output": "AMResultPromise { Operation-0 }",
              },
            ],
          }
      `);
  });

  test('single query', () => {
    const rq = gql`
      {
        post(where: { id: "" }) {
          id
          title
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);
    expect(transaction).toMatchInlineSnapshot(`
          Object {
            "operations": Array [
              Object {
                "collectionName": "posts",
                "fieldsSelection": Object {
                  "fields": Array [
                    "_id",
                    "title",
                  ],
                },
                "identifier": "Operation-0",
                "kind": "AMReadOperation",
                "many": false,
                "output": "AMResultPromise { Operation-0 }",
                "selector": Object {
                  "_id": "",
                },
              },
            ],
          }
      `);
  });

  test('create', () => {
    const rq = gql`
      mutation {
        createPost(data: { title: "test-title" }) {
          id
          title
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);
    expect(transaction).toMatchInlineSnapshot(`
              Object {
                "operations": Array [
                  Object {
                    "collectionName": "posts",
                    "data": Object {
                      "title": "test-title",
                    },
                    "fieldsSelection": Object {
                      "fields": Array [
                        "_id",
                        "title",
                      ],
                    },
                    "identifier": "Operation-0",
                    "kind": "AMCreateOperation",
                    "many": false,
                    "output": "AMResultPromise { Operation-0 }",
                  },
                ],
              }
      `);
  });

  test('orderBy', () => {
    const rq = gql`
      {
        posts(orderBy: title_ASC) {
          id
          title
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);
    expect(transaction).toMatchInlineSnapshot(`
      Object {
        "operations": Array [
          Object {
            "collectionName": "posts",
            "fieldsSelection": Object {
              "fields": Array [
                "_id",
                "title",
              ],
            },
            "identifier": "Operation-0",
            "kind": "AMReadOperation",
            "many": true,
            "orderBy": Object {
              "title": 1,
            },
            "output": "AMResultPromise { Operation-0 }",
          },
        ],
      }
    `);
  });
});

describe('nested objects', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      comments: [Comment]!
      pinnedComment: Comment
    }

    type Comment @embedded {
      message: String
    }
  `);

  test('create nested', () => {
    const rq = gql`
      mutation {
        createPost(
          data: {
            title: "test-title"
            pinnedComment: { create: { message: "comment-1" } }
          }
        ) {
          id
          title
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);
    expect(transaction).toMatchInlineSnapshot(`
            Object {
              "operations": Array [
                Object {
                  "collectionName": "posts",
                  "data": Object {
                    "pinnedComment": Object {
                      "message": "comment-1",
                    },
                    "title": "test-title",
                  },
                  "fieldsSelection": Object {
                    "fields": Array [
                      "_id",
                      "title",
                    ],
                  },
                  "identifier": "Operation-0",
                  "kind": "AMCreateOperation",
                  "many": false,
                  "output": "AMResultPromise { Operation-0 }",
                },
              ],
            }
    `);
  });

  test('create nested list', () => {
    const rq = gql`
      mutation {
        createPost(
          data: {
            title: "test-title"
            comments: {
              create: [{ message: "comment-1" }, { message: "comment-2" }]
            }
          }
        ) {
          id
          title
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);
    expect(transaction).toMatchInlineSnapshot(`
              Object {
                "operations": Array [
                  Object {
                    "collectionName": "posts",
                    "data": Object {
                      "comments": Array [
                        Object {
                          "message": "comment-1",
                        },
                        Object {
                          "message": "comment-2",
                        },
                      ],
                      "title": "test-title",
                    },
                    "fieldsSelection": Object {
                      "fields": Array [
                        "_id",
                        "title",
                      ],
                    },
                    "identifier": "Operation-0",
                    "kind": "AMCreateOperation",
                    "many": false,
                    "output": "AMResultPromise { Operation-0 }",
                  },
                ],
              }
    `);
  });
});

describe('relation', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
    }

    type Comment @model {
      id: ID @id @unique @db(name: "_id")
      post: Post @relation
      message: String
      likes: [User!] @relation
    }

    type User @model {
      id: ID @id @unique @db(name: "_id")
      username: String
    }

    type Postbox @model {
      id: ID @id @unique @db(name: "_id")
      post: Post! @relation
    }
  `);

  test('select fields', () => {
    const rq = gql`
      {
        comments {
          id
          post {
            id
          }
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);

    expect(transaction).toMatchInlineSnapshot(`
              Object {
                "operations": Array [
                  Object {
                    "collectionName": "comments",
                    "fieldsSelection": Object {
                      "fields": Array [
                        "_id",
                        "postId",
                      ],
                    },
                    "identifier": "Operation-0",
                    "kind": "AMReadOperation",
                    "many": true,
                    "output": "AMResultPromise { Operation-0 -> distinctReplace('postId', '_id', AMResultPromise { Operation-1 }) }",
                  },
                  Object {
                    "collectionName": "posts",
                    "fieldsSelection": Object {
                      "fields": Array [
                        "_id",
                      ],
                    },
                    "identifier": "Operation-1",
                    "kind": "AMReadOperation",
                    "many": true,
                    "output": "AMResultPromise { Operation-1 }",
                    "selector": Object {
                      "_id": Object {
                        "$in": "AMResultPromise { Operation-0 -> distinct('postId') }",
                      },
                    },
                  },
                ],
              }
    `);
  });

  test('connect', () => {
    const rq = gql`
      mutation {
        createComment(
          data: {
            message: "comment-1"
            post: { connect: { id: "post-id" } }
            likes: { connect: [{ id: "user-1" }, { id: "user-2" }] }
          }
        ) {
          id
          message
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);

    expect(transaction).toMatchInlineSnapshot(`
              Object {
                "operations": Array [
                  Object {
                    "collectionName": "comments",
                    "data": Object {
                      "message": "comment-1",
                      "postId": "AMResultPromise { Operation-1 -> path('_id') }",
                      "userIds": "AMResultPromise { Operation-2 -> distinct('_id') }",
                    },
                    "fieldsSelection": Object {
                      "fields": Array [
                        "_id",
                        "message",
                      ],
                    },
                    "identifier": "Operation-0",
                    "kind": "AMCreateOperation",
                    "many": false,
                    "output": "AMResultPromise { Operation-0 }",
                  },
                  Object {
                    "collectionName": "posts",
                    "identifier": "Operation-1",
                    "kind": "AMReadOperation",
                    "many": false,
                    "output": "AMResultPromise { Operation-1 }",
                    "selector": Object {
                      "_id": "post-id",
                    },
                  },
                  Object {
                    "collectionName": "users",
                    "identifier": "Operation-2",
                    "kind": "AMReadOperation",
                    "many": true,
                    "output": "AMResultPromise { Operation-2 }",
                    "selector": Object {
                      "$or": Array [
                        Object {
                          "_id": "user-1",
                        },
                        Object {
                          "_id": "user-2",
                        },
                      ],
                    },
                  },
                ],
              }
      `);
  });

  test('create', () => {
    const rq = gql`
      mutation {
        createComment(
          data: {
            message: "comment-1"
            post: { create: { title: "new post" } }
          }
        ) {
          id
          message
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);

    expect(transaction).toMatchInlineSnapshot(`
          Object {
            "operations": Array [
              Object {
                "collectionName": "comments",
                "data": Object {
                  "message": "comment-1",
                  "postId": "AMResultPromise { Operation-1 -> path('_id') }",
                },
                "fieldsSelection": Object {
                  "fields": Array [
                    "_id",
                    "message",
                  ],
                },
                "identifier": "Operation-0",
                "kind": "AMCreateOperation",
                "many": false,
                "output": "AMResultPromise { Operation-0 }",
              },
              Object {
                "collectionName": "posts",
                "data": Object {
                  "title": "new post",
                },
                "identifier": "Operation-1",
                "kind": "AMCreateOperation",
                "many": false,
                "output": "AMResultPromise { Operation-1 }",
              },
            ],
          }
      `);
  });

  test('where relation', () => {
    const rq = gql`
      {
        comments(where: { post: { title: "search-title" } }) {
          id
          message
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);

    expect(transaction).toMatchInlineSnapshot(`
            Object {
              "operations": Array [
                Object {
                  "collectionName": "comments",
                  "fieldsSelection": Object {
                    "fields": Array [
                      "_id",
                      "message",
                    ],
                  },
                  "identifier": "Operation-0",
                  "kind": "AMReadOperation",
                  "many": true,
                  "output": "AMResultPromise { Operation-0 }",
                  "selector": Object {
                    "postId": Object {
                      "$in": "AMResultPromise { Operation-1 -> distinct('_id') }",
                    },
                  },
                },
                Object {
                  "collectionName": "posts",
                  "identifier": "Operation-1",
                  "kind": "AMReadOperation",
                  "many": true,
                  "output": "AMResultPromise { Operation-1 }",
                  "selector": Object {
                    "title": "search-title",
                  },
                },
              ],
            }
      `);
  });

  test('required relation exceptions', () => {
    const rq = gql`
      mutation {
        createPostbox(data: { post: {} }) {
          id
        }
      }
    `;

    const code = () => {
      const transaction = new AMTransaction();
      AMVisitor.visit(schema, rq, {}, transaction);
    };

    expect(code).toThrow(UserInputError);
    expect(code).toThrow(`'create' or 'connect' needed`);
  });
});

describe('extRelation', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      comments: [Comment] @extRelation
    }

    type Comment @model {
      id: ID @id @unique @db(name: "_id")
      post: Post @relation
      message: String
    }
  `);

  test('read', () => {
    const rq = gql`
      {
        posts {
          comments {
            message
          }
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);
    expect(transaction).toMatchInlineSnapshot(`
            Object {
              "operations": Array [
                Object {
                  "collectionName": "posts",
                  "fieldsSelection": Object {
                    "fields": Array [
                      "_id",
                    ],
                  },
                  "identifier": "Operation-0",
                  "kind": "AMReadOperation",
                  "many": true,
                  "output": "AMResultPromise { Operation-0 -> lookup('comments', '_id', 'postId', AMResultPromise { Operation-1 }) }",
                },
                Object {
                  "collectionName": "comments",
                  "fieldsSelection": Object {
                    "fields": Array [
                      "message",
                    ],
                  },
                  "identifier": "Operation-1",
                  "kind": "AMReadOperation",
                  "many": true,
                  "output": "AMResultPromise { Operation-1 }",
                  "selector": Object {
                    "postId": Object {
                      "$in": "AMResultPromise { Operation-0 -> distinct('_id') }",
                    },
                  },
                },
              ],
            }
      `);
  });
});

describe('interfaces', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      owner: User @relation
    }

    interface User @model @inherit {
      id: ID @id @unique @db(name: "_id")
    }

    type Admin implements User {
      username: String
    }

    type Subscriber implements User {
      profile: SubscriberProfile
    }

    type SubscriberProfile @embedded {
      name: String
    }
  `);

  test('create relation', () => {
    const rq = gql`
      mutation {
        createPost(
          data: {
            title: "post title"
            owner: { create: { Admin: { username: "new admin" } } }
          }
        ) {
          id
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);
    expect(transaction).toMatchInlineSnapshot(`
          Object {
            "operations": Array [
              Object {
                "collectionName": "posts",
                "data": Object {
                  "title": "post title",
                  "userId": "AMResultPromise { Operation-1 -> path('_id') }",
                },
                "fieldsSelection": Object {
                  "fields": Array [
                    "_id",
                  ],
                },
                "identifier": "Operation-0",
                "kind": "AMCreateOperation",
                "many": false,
                "output": "AMResultPromise { Operation-0 }",
              },
              Object {
                "collectionName": "users",
                "data": Object {
                  "_type": "admin",
                  "username": "new admin",
                },
                "identifier": "Operation-1",
                "kind": "AMCreateOperation",
                "many": false,
                "output": "AMResultPromise { Operation-1 }",
              },
            ],
          }
    `);
  });
});
