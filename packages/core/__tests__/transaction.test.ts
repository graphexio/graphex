import * as DirectiveImplements from '@apollo-model/directive-implements';
import gql from 'graphql-tag';
import AMM from '../src';
import { applyInputTransform } from '../src/inputTypes/utils';
import { AMVisitor } from '../src/execution/visitor';
import { AMTransaction } from '../src/execution/transaction';
import { UserInputError } from 'apollo-server';

const generateSchema = typeDefs => {
  return new AMM({
    modules: [DirectiveImplements],
    queryExecutor: null,
  }).makeExecutableSchema({
    resolverValidationOptions: {
      requireResolversForResolveType: false,
    },
    typeDefs: [typeDefs],
  });
};

const buildFederatedSchema = typeDefs => {
  return new AMM({
    modules: [DirectiveImplements],
    queryExecutor: null,
  }).buildFederatedSchema({
    resolverValidationOptions: {
      requireResolversForResolveType: false,
    },
    typeDefs: [typeDefs],
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
          __typename
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
        post(where: { id: "post-id" }) {
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
                          "_id": "post-id",
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

  test('orderBy dbname', () => {
    const rq = gql`
      {
        posts(orderBy: id_ASC) {
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
                      "_id": 1,
                    },
                    "output": "AMResultPromise { Operation-0 }",
                  },
                ],
              }
          `);
  });

  test('update', () => {
    const rq = gql`
      mutation {
        updatePost(where: { id: "PostID" }, data: { title: "new title" }) {
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
                          "$set": Object {
                            "title": "new title",
                          },
                        },
                        "fieldsSelection": Object {
                          "fields": Array [
                            "_id",
                            "title",
                          ],
                        },
                        "identifier": "Operation-0",
                        "kind": "AMUpdateOperation",
                        "many": false,
                        "output": "AMResultPromise { Operation-0 }",
                        "selector": Object {
                          "_id": "PostID",
                        },
                      },
                    ],
                  }
          `);
  });

  test('connection', () => {
    const rq = gql`
      {
        postsConnection(skip: 2, first: 1) {
          aggregate {
            count
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
                        "fields": Array [],
                      },
                      "first": 1,
                      "identifier": "Operation-0",
                      "kind": "AMAggregateOperation",
                      "many": false,
                      "output": "AMResultPromise { Operation-0 }",
                      "skip": 2,
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

  test('update nested', async () => {
    const rq = gql`
      mutation {
        updatePost(
          data: { pinnedComment: { update: { message: "test-title" } } }
          where: { id: "PostId" }
        ) {
          id
          pinnedComment {
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
                          "data": Object {
                            "$set": Object {
                              "pinnedComment.message": "test-title",
                            },
                          },
                          "fieldsSelection": Object {
                            "fields": Array [
                              "_id",
                              "pinnedComment.message",
                            ],
                          },
                          "identifier": "Operation-0",
                          "kind": "AMUpdateOperation",
                          "many": false,
                          "output": "AMResultPromise { Operation-0 }",
                          "selector": Object {
                            "_id": "PostId",
                          },
                        },
                      ],
                    }
          `);
  });

  test('update nested list create', async () => {
    const rq = gql`
      mutation {
        updatePost(
          data: { comments: { create: [{ message: "test-title" }] } }
          where: { id: "PostId" }
        ) {
          id
          comments {
            message
          }
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);
    expect(transaction.operations[0].data).toMatchInlineSnapshot(`
                        Object {
                          "$push": Object {
                            "comments": Object {
                              "$each": Array [
                                Object {
                                  "message": "test-title",
                                },
                              ],
                            },
                          },
                        }
          `);
  });

  test('update nested list recreate', async () => {
    const rq = gql`
      mutation {
        updatePost(
          data: { comments: { recreate: [{ message: "test-title" }] } }
          where: { id: "PostId" }
        ) {
          id
          comments {
            message
          }
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);
    expect(transaction.operations[0].data).toMatchInlineSnapshot(`
              Object {
                "$set": Object {
                  "comments": Array [
                    Object {
                      "message": "test-title",
                    },
                  ],
                },
              }
          `);
  });

  test('update nested list updateMany', async () => {
    const rq = gql`
      mutation {
        updatePost(
          data: {
            comments: {
              updateMany: [
                {
                  where: { message: "test-title" }
                  data: { message: "new-title " }
                }
                {
                  where: { message: "test-title2" }
                  data: { message: "new-title2 " }
                }
              ]
            }
          }
          where: { id: "PostId" }
        ) {
          id
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
                        "arrayFilters": Array [
                          Object {
                            "arrFltr0": Object {
                              "message": "test-title",
                            },
                          },
                          Object {
                            "arrFltr1": Object {
                              "message": "test-title2",
                            },
                          },
                        ],
                        "collectionName": "posts",
                        "data": Object {
                          "$set": Object {
                            "comments.$[arrFltr0].message": "new-title ",
                            "comments.$[arrFltr1].message": "new-title2 ",
                          },
                        },
                        "fieldsSelection": Object {
                          "fields": Array [
                            "_id",
                            "comments.message",
                          ],
                        },
                        "identifier": "Operation-0",
                        "kind": "AMUpdateOperation",
                        "many": false,
                        "output": "AMResultPromise { Operation-0 }",
                        "selector": Object {
                          "_id": "PostId",
                        },
                      },
                    ],
                  }
        `);
  });

  test('update nested create', async () => {
    const rq = gql`
      mutation {
        updatePost(
          data: { pinnedComment: { create: { message: "test-title" } } }
          where: { id: "PostId" }
        ) {
          id
          pinnedComment {
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
                        "data": Object {
                          "$set": Object {
                            "pinnedComment": Object {
                              "message": "test-title",
                            },
                          },
                        },
                        "fieldsSelection": Object {
                          "fields": Array [
                            "_id",
                            "pinnedComment.message",
                          ],
                        },
                        "identifier": "Operation-0",
                        "kind": "AMUpdateOperation",
                        "many": false,
                        "output": "AMResultPromise { Operation-0 }",
                        "selector": Object {
                          "_id": "PostId",
                        },
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

  test('connect in variable', () => {
    const rq = gql`
      mutation createComment($data: CommentCreateInput!) {
        createComment(data: $data) {
          id
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(
      schema,
      rq,
      { data: { post: { connect: { id: 'post-id' } } } },
      transaction
    );

    expect(transaction).toMatchInlineSnapshot(`
              Object {
                "operations": Array [
                  Object {
                    "collectionName": "comments",
                    "data": Object {
                      "postId": "AMResultPromise { Operation-1 -> path('_id') }",
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
                    "collectionName": "posts",
                    "identifier": "Operation-1",
                    "kind": "AMReadOperation",
                    "many": false,
                    "output": "AMResultPromise { Operation-1 }",
                    "selector": Object {
                      "_id": "post-id",
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

  test('create many', () => {
    const rq = gql`
      mutation {
        createComment(
          data: {
            message: "comment-1"
            likes: { create: [{ username: "new user" }] }
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
                                      "userIds": "AMResultPromise { Operation-1 -> path('insertedIds') }",
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
                                    "collectionName": "users",
                                    "dataList": Array [
                                      Object {
                                        "username": "new user",
                                      },
                                    ],
                                    "identifier": "Operation-1",
                                    "kind": "AMCreateOperation",
                                    "many": true,
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

  test('update relation-many create', () => {
    const rq = gql`
      mutation {
        updateComment(
          where: { id: "test-id" }
          data: { likes: { create: [{ username: "new-user" }] } }
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
            "collectionName": "comments",
            "data": Object {
              "$push": Object {
                "userIds": Object {
                  "$each": Array [
                    "AMResultPromise { Operation-1 -> path('insertedIds') }",
                  ],
                },
              },
            },
            "fieldsSelection": Object {
              "fields": Array [
                "_id",
              ],
            },
            "identifier": "Operation-0",
            "kind": "AMUpdateOperation",
            "many": false,
            "output": "AMResultPromise { Operation-0 }",
            "selector": Object {
              "_id": "test-id",
            },
          },
          Object {
            "collectionName": "users",
            "dataList": Array [
              Object {
                "username": "new-user",
              },
            ],
            "identifier": "Operation-1",
            "kind": "AMCreateOperation",
            "many": true,
            "output": "AMResultPromise { Operation-1 }",
          },
        ],
      }
    `);
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
      approves: [Post] @relation(storeField: "approvesPostIds")
    }

    type Subscriber implements User {
      profile: SubscriberProfile
      likes: [Post] @relation(storeField: "likesPostIds")
    }

    type SubscriberProfile @embedded {
      name: String
    }
  `);

  test('multiple query', () => {
    const rq = gql`
      query {
        admins {
          username
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);
    expect(transaction).toMatchInlineSnapshot(`
      Object {
        "operations": Array [
          Object {
            "collectionName": "users",
            "fieldsSelection": Object {
              "fields": Array [
                "username",
              ],
            },
            "identifier": "Operation-0",
            "kind": "AMReadOperation",
            "many": true,
            "output": "AMResultPromise { Operation-0 }",
            "selector": Object {
              "_type": "admin",
            },
          },
        ],
      }
    `);
  });

  test('single query', () => {
    const rq = gql`
      query {
        admin {
          username
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);
    expect(transaction).toMatchInlineSnapshot(`
      Object {
        "operations": Array [
          Object {
            "collectionName": "users",
            "fieldsSelection": Object {
              "fields": Array [
                "username",
              ],
            },
            "identifier": "Operation-0",
            "kind": "AMReadOperation",
            "many": false,
            "output": "AMResultPromise { Operation-0 }",
            "selector": Object {
              "_type": "admin",
            },
          },
        ],
      }
    `);
  });

  test('update query', () => {
    const rq = gql`
      mutation {
        updateAdmin(
          where: { id: "admin-1" }
          data: { username: "username-1" }
        ) {
          username
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);
    expect(transaction).toMatchInlineSnapshot(`
      Object {
        "operations": Array [
          Object {
            "collectionName": "users",
            "data": Object {
              "$set": Object {
                "username": "username-1",
              },
            },
            "fieldsSelection": Object {
              "fields": Array [
                "username",
              ],
            },
            "identifier": "Operation-0",
            "kind": "AMUpdateOperation",
            "many": false,
            "output": "AMResultPromise { Operation-0 }",
            "selector": Object {
              "_id": "admin-1",
              "_type": "admin",
            },
          },
        ],
      }
    `);
  });

  test('update query', () => {
    const rq = gql`
      mutation {
        updateAdmin(
          where: { id: "admin-1" }
          data: { username: "username-1" }
        ) {
          username
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);
    expect(transaction).toMatchInlineSnapshot(`
      Object {
        "operations": Array [
          Object {
            "collectionName": "users",
            "data": Object {
              "$set": Object {
                "username": "username-1",
              },
            },
            "fieldsSelection": Object {
              "fields": Array [
                "username",
              ],
            },
            "identifier": "Operation-0",
            "kind": "AMUpdateOperation",
            "many": false,
            "output": "AMResultPromise { Operation-0 }",
            "selector": Object {
              "_id": "admin-1",
              "_type": "admin",
            },
          },
        ],
      }
    `);
  });

  test('single delete mutation', () => {
    const rq = gql`
      mutation {
        deleteAdmin(where: { id: "admin-1" }) {
          username
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);
    expect(transaction).toMatchInlineSnapshot(`
      Object {
        "operations": Array [
          Object {
            "collectionName": "users",
            "fieldsSelection": Object {
              "fields": Array [
                "username",
              ],
            },
            "identifier": "Operation-0",
            "kind": "AMDeleteOperation",
            "many": false,
            "output": "AMResultPromise { Operation-0 }",
            "selector": Object {
              "_id": "admin-1",
              "_type": "admin",
            },
          },
        ],
      }
    `);
  });

  test('multiple delete mutation', () => {
    const rq = gql`
      mutation {
        deleteAdmins(where: { id: "admin-1" })
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);
    expect(transaction).toMatchInlineSnapshot(`
      Object {
        "operations": Array [
          Object {
            "collectionName": "users",
            "identifier": "Operation-0",
            "kind": "AMDeleteOperation",
            "many": true,
            "output": "AMResultPromise { Operation-0 }",
            "selector": Object {
              "_id": "admin-1",
              "_type": "admin",
            },
          },
        ],
      }
    `);
  });

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

  test('fragments', () => {
    const rq = gql`
      query {
        users {
          id
          ... on Admin {
            ... on Admin {
              username
            }
          }
          ... on Subscriber {
            profile {
              name
            }
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
            "collectionName": "users",
            "fieldsSelection": Object {
              "fields": Array [
                "_id",
                "username",
                "profile.name",
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

  test('relations in fragments', () => {
    const rq = gql`
      query {
        users {
          id
          ... on Admin {
            approves {
              id
            }
          }
          ... on Subscriber {
            likes {
              id
            }
          }
        }
      }
    `;

    //TODO: Fix filtering distinct and distinctReplace
    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);
    expect(transaction).toMatchInlineSnapshot(`
    Object {
      "operations": Array [
        Object {
          "collectionName": "users",
          "fieldsSelection": Object {
            "fields": Array [
              "_id",
              "approvesPostIds",
              "likesPostIds",
            ],
          },
          "identifier": "Operation-0",
          "kind": "AMReadOperation",
          "many": true,
          "output": "AMResultPromise { Operation-0 -> distinctReplace('approvesPostIds', '_id', AMResultPromise { Operation-1 }) -> distinctReplace('likesPostIds', '_id', AMResultPromise { Operation-2 }) }",
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
              "$in": "AMResultPromise { Operation-0 -> distinct('approvesPostIds') }",
            },
          },
        },
        Object {
          "collectionName": "posts",
          "fieldsSelection": Object {
            "fields": Array [
              "_id",
            ],
          },
          "identifier": "Operation-2",
          "kind": "AMReadOperation",
          "many": true,
          "output": "AMResultPromise { Operation-2 }",
          "selector": Object {
            "_id": Object {
              "$in": "AMResultPromise { Operation-0 -> distinct('likesPostIds') }",
            },
          },
        },
      ],
    }
  `);
  });
});

describe('abstract interface', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      owner: User! @relation
      likes: [User] @relation
    }

    interface User @abstract @inherit {
      id: ID @id @unique @db(name: "_id")
    }

    type Admin implements User @model {
      username: String
    }

    type Subscriber implements User @model {
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
          owner {
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
                      "collectionName": "posts",
                      "data": Object {
                        "title": "post title",
                        "userId": "AMResultPromise { Operation-1 -> path('_id') -> dbRef('admins') }",
                      },
                      "fieldsSelection": Object {
                        "fields": Array [
                          "_id",
                          "userId",
                        ],
                      },
                      "identifier": "Operation-0",
                      "kind": "AMCreateOperation",
                      "many": false,
                      "output": "AMResultPromise { Operation-0 -> dbRefReplace('userId', AMResultPromise { Operation-2 }) }",
                    },
                    Object {
                      "collectionName": "admins",
                      "data": Object {
                        "username": "new admin",
                      },
                      "identifier": "Operation-1",
                      "kind": "AMCreateOperation",
                      "many": false,
                      "output": "AMResultPromise { Operation-1 }",
                    },
                    Object {
                      "collectionName": undefined,
                      "dbRefList": "AMResultPromise { Operation-0 -> distinct('userId') }",
                      "fieldsSelection": Object {
                        "fields": Array [
                          "_id",
                        ],
                      },
                      "identifier": "Operation-2",
                      "kind": "AMReadDBRefOperation",
                      "many": true,
                      "output": "AMResultPromise { Operation-2 }",
                    },
                  ],
                }
        `);
  });

  test('create relation many', () => {
    const rq = gql`
      mutation {
        createPost(
          data: {
            title: "post title"
            likes: { create: [{ Admin: { username: "new admin" } }] }
          }
        ) {
          id
          owner {
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
                          "collectionName": "posts",
                          "data": Object {
                            "title": "post title",
                            "userIds": Array [
                              "AMResultPromise { Operation-1 -> path('_id') -> dbRef('admins') }",
                            ],
                          },
                          "fieldsSelection": Object {
                            "fields": Array [
                              "_id",
                              "userId",
                            ],
                          },
                          "identifier": "Operation-0",
                          "kind": "AMCreateOperation",
                          "many": false,
                          "output": "AMResultPromise { Operation-0 -> dbRefReplace('userId', AMResultPromise { Operation-2 }) }",
                        },
                        Object {
                          "collectionName": "admins",
                          "data": Object {
                            "username": "new admin",
                          },
                          "identifier": "Operation-1",
                          "kind": "AMCreateOperation",
                          "many": false,
                          "output": "AMResultPromise { Operation-1 }",
                        },
                        Object {
                          "collectionName": undefined,
                          "dbRefList": "AMResultPromise { Operation-0 -> distinct('userId') }",
                          "fieldsSelection": Object {
                            "fields": Array [
                              "_id",
                            ],
                          },
                          "identifier": "Operation-2",
                          "kind": "AMReadDBRefOperation",
                          "many": true,
                          "output": "AMResultPromise { Operation-2 }",
                        },
                      ],
                    }
            `);
  });

  test('create relation many with single item', () => {
    const rq = gql`
      mutation {
        createPost(
          data: {
            title: "post title"
            likes: { create: { Admin: { username: "new admin" } } }
          }
        ) {
          id
          owner {
            id
          }
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);
    expect(transaction.operations[0].data).toMatchInlineSnapshot(`
                  Object {
                    "title": "post title",
                    "userIds": Array [
                      "AMResultPromise { Operation-1 -> path('_id') -> dbRef('admins') }",
                    ],
                  }
            `);
  });

  test('update relation many create', () => {
    const rq = gql`
      mutation {
        updatePost(
          where: { id: "post-id" }
          data: { likes: { create: [{ Admin: { username: "new admin" } }] } }
        ) {
          id
          owner {
            id
          }
          likes {
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
            "collectionName": "posts",
            "data": Object {
              "$push": Object {
                "userIds": Object {
                  "$each": Array [
                    "AMResultPromise { Operation-1 -> path('_id') -> dbRef('admins') }",
                  ],
                },
              },
            },
            "fieldsSelection": Object {
              "fields": Array [
                "_id",
                "userId",
                "userIds",
              ],
            },
            "identifier": "Operation-0",
            "kind": "AMUpdateOperation",
            "many": false,
            "output": "AMResultPromise { Operation-0 -> dbRefReplace('userId', AMResultPromise { Operation-2 }) -> dbRefReplace('userIds', AMResultPromise { Operation-3 }) }",
            "selector": Object {
              "_id": "post-id",
            },
          },
          Object {
            "collectionName": "admins",
            "data": Object {
              "username": "new admin",
            },
            "identifier": "Operation-1",
            "kind": "AMCreateOperation",
            "many": false,
            "output": "AMResultPromise { Operation-1 }",
          },
          Object {
            "collectionName": undefined,
            "dbRefList": "AMResultPromise { Operation-0 -> distinct('userId') }",
            "fieldsSelection": Object {
              "fields": Array [
                "_id",
              ],
            },
            "identifier": "Operation-2",
            "kind": "AMReadDBRefOperation",
            "many": true,
            "output": "AMResultPromise { Operation-2 }",
          },
          Object {
            "collectionName": undefined,
            "dbRefList": "AMResultPromise { Operation-0 -> distinct('userIds') }",
            "fieldsSelection": Object {
              "fields": Array [
                "_id",
              ],
            },
            "identifier": "Operation-3",
            "kind": "AMReadDBRefOperation",
            "many": true,
            "output": "AMResultPromise { Operation-3 }",
          },
        ],
      }
    `);
  });
});

describe('federated', () => {
  const schema = buildFederatedSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      owner: User @relation
      likes: [User] @relation
    }

    interface User @abstract @inherit {
      id: ID @id @unique @db(name: "_id")
    }

    type Admin implements User @model {
      username: String
    }

    type Subscriber implements User @model {
      profile: SubscriberProfile
    }

    type SubscriberProfile @embedded {
      name: String
    }
  `);

  test('entities', () => {
    const rq = gql`
      query {
        _entities(representations: [{ __typename: "Post", id: "post-id" }]) {
          __typename
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);
    expect(transaction).toMatchInlineSnapshot(`
      Object {
        "operations": Array [
          Object {
            "collectionName": undefined,
            "identifier": "Operation-0",
            "kind": "AMReadEntitiesOperation",
            "output": "AMResultPromise { Operation-0 }",
            "representations": Array [
              Object {
                "collectionName": "posts",
                "selector": Object {
                  "_id": "post-id",
                },
                "typename": "Post",
              },
            ],
          },
        ],
      }
    `);
  });
});

describe('variables', () => {
  const schema = buildFederatedSchema(gql`
    scalar Content

    type EmbeddedContent @embedded {
      content: Content
    }

    type Post @model {
      id: ID @id @unique @db(name: "_id")
      content: Content
      contents: [Content!]
      embeddedContent: EmbeddedContent
    }
  `);

  // test('inline', () => {
  //   const rq = gql`
  //     mutation {
  //       createPost(
  //         data: { content: { body: "body", tags: ["tag1", "tag2"] } }
  //       ) {
  //         id
  //       }
  //     }
  //   `;

  //   const transaction = new AMTransaction();
  //   AMVisitor.visit(schema, rq, {}, transaction);
  //   expect(transaction).toMatchInlineSnapshot(`
  //     Object {
  //       "operations": Array [
  //         Object {
  //           "collectionName": "posts",
  //           "data": Object {
  //             "content": Object {
  //               "body": "body",
  //               "tags": Array [
  //                 "tag1",
  //                 "tag2",
  //               ],
  //             },
  //           },
  //           "fieldsSelection": Object {
  //             "fields": Array [
  //               "_id",
  //             ],
  //           },
  //           "identifier": "Operation-0",
  //           "kind": "AMCreateOperation",
  //           "many": false,
  //           "output": "AMResultPromise { Operation-0 }",
  //         },
  //       ],
  //     }
  //   `);
  // });

  test('object variable', () => {
    const rq = gql`
      mutation createPost(
        $embeddedContent: EmbeddedContentCreateOneNestedInput
      ) {
        createPost(data: { embeddedContent: $embeddedContent }) {
          id
        }
      }
    `;
    const variables = {
      embeddedContent: {
        create: { content: { body: 'body', tags: ['tag1', 'tag2'] } },
      },
    };

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, variables, transaction);
    expect(transaction).toMatchInlineSnapshot(`
      Object {
        "operations": Array [
          Object {
            "collectionName": "posts",
            "data": Object {
              "embeddedContent": Object {
                "content": Object {
                  "body": "body",
                  "tags": Array [
                    "tag1",
                    "tag2",
                  ],
                },
              },
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
        ],
      }
    `);
  });

  test('scalar variable', () => {
    const rq = gql`
      mutation createPost($content: Content) {
        createPost(data: { content: $content }) {
          id
        }
      }
    `;
    const variables = { content: { body: 'body', tags: ['tag1', 'tag2'] } };

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, variables, transaction);
    expect(transaction).toMatchInlineSnapshot(`
      Object {
        "operations": Array [
          Object {
            "collectionName": "posts",
            "data": Object {
              "content": Object {
                "body": "body",
                "tags": Array [
                  "tag1",
                  "tag2",
                ],
              },
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
        ],
      }
    `);
  });

  test('array of scalars variable', () => {
    const rq = gql`
      mutation createPost($contents: [Content!]!) {
        createPost(data: { contents: $contents }) {
          id
        }
      }
    `;
    const variables = { contents: [{ body: 'body', tags: ['tag1', 'tag2'] }] };

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, variables, transaction);
    expect(transaction).toMatchInlineSnapshot(`
      Object {
        "operations": Array [
          Object {
            "collectionName": "posts",
            "data": Object {
              "contents": Array [
                Object {
                  "body": "body",
                  "tags": Array [
                    "tag1",
                    "tag2",
                  ],
                },
              ],
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
        ],
      }
    `);
  });
});
