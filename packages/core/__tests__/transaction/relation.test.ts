import gql from 'graphql-tag';
import { UserInputError } from 'apollo-server';
import { generateSchema } from './generateSchema';
import { prepareTransaction } from '../utils/prepareTransaction';
import { AMVisitor } from '../../src/execution/visitor';
import { AMTransaction } from '../../src/execution/transaction';

import Serializer from '../../src/serializer';
expect.addSnapshotSerializer(Serializer);

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

    const transaction = prepareTransaction(schema, rq);

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
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
            },
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
            "output": ResultPromise {
              "source": Array [
                "Operation-1",
                IndexBy {
                  "params": Object {
                    "groupingField": "_id",
                  },
                },
              ],
            },
            "selector": Object {
              "_id": Object {
                "$in": ResultPromise {
                  "source": "<Batch>",
                },
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

    const transaction = prepareTransaction(schema, rq);

    expect(transaction).toMatchInlineSnapshot(`
      Object {
        "operations": Array [
          Object {
            "collectionName": "comments",
            "data": Object {
              "message": "comment-1",
              "postId": ResultPromise {
                "source": Array [
                  "Operation-1",
                  Path {
                    "path": "_id",
                  },
                ],
              },
              "userIds": ResultPromise {
                "source": Array [
                  "Operation-2",
                  Distinct {
                    "path": "_id",
                  },
                ],
              },
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
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
            },
          },
          Object {
            "collectionName": "posts",
            "identifier": "Operation-1",
            "kind": "AMReadOperation",
            "many": false,
            "output": ResultPromise {
              "source": Array [
                "Operation-1",
              ],
            },
            "selector": Object {
              "_id": "post-id",
            },
          },
          Object {
            "collectionName": "users",
            "identifier": "Operation-2",
            "kind": "AMReadOperation",
            "many": true,
            "output": ResultPromise {
              "source": Array [
                "Operation-2",
              ],
            },
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

    const transaction = new AMTransaction(new Map());
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
              "postId": ResultPromise {
                "source": Array [
                  "Operation-1",
                  Path {
                    "path": "_id",
                  },
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
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
            },
          },
          Object {
            "collectionName": "posts",
            "identifier": "Operation-1",
            "kind": "AMReadOperation",
            "many": false,
            "output": ResultPromise {
              "source": Array [
                "Operation-1",
              ],
            },
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

    const transaction = prepareTransaction(schema, rq);

    expect(transaction).toMatchInlineSnapshot(`
      Object {
        "operations": Array [
          Object {
            "collectionName": "comments",
            "data": Object {
              "message": "comment-1",
              "postId": ResultPromise {
                "source": Array [
                  "Operation-1",
                  Path {
                    "path": "_id",
                  },
                ],
              },
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
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
            },
          },
          Object {
            "collectionName": "posts",
            "data": Object {
              "title": "new post",
            },
            "identifier": "Operation-1",
            "kind": "AMCreateOperation",
            "many": false,
            "output": ResultPromise {
              "source": Array [
                "Operation-1",
              ],
            },
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

    const transaction = prepareTransaction(schema, rq);

    expect(transaction).toMatchInlineSnapshot(`
Object {
  "operations": Array [
    Object {
      "collectionName": "comments",
      "data": Object {
        "message": "comment-1",
        "userIds": ResultPromise {
          "source": Array [
            "Operation-1",
            Distinct {
              "path": "_id",
            },
          ],
        },
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
      "output": ResultPromise {
        "source": Array [
          "Operation-0",
        ],
      },
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
      "output": ResultPromise {
        "source": Array [
          "Operation-1",
        ],
      },
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

    const transaction = prepareTransaction(schema, rq);

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
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
            },
            "selector": Object {
              "postId": Object {
                "$in": ResultPromise {
                  "source": Array [
                    "Operation-1",
                    Distinct {
                      "path": "_id",
                    },
                  ],
                },
              },
            },
          },
          Object {
            "collectionName": "posts",
            "identifier": "Operation-1",
            "kind": "AMReadOperation",
            "many": true,
            "output": ResultPromise {
              "source": Array [
                "Operation-1",
              ],
            },
            "selector": Object {
              "title": "search-title",
            },
          },
        ],
      }
    `);
  });

  test('where relation null', () => {
    const rq = gql`
      {
        comments(where: { post: null }) {
          id
          message
        }
      }
    `;

    const transaction = prepareTransaction(schema, rq);

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
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
            },
            "selector": Object {
              "postId": null,
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
      const transaction = new AMTransaction(new Map());
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

    const transaction = prepareTransaction(schema, rq);
    expect(transaction).toMatchInlineSnapshot(`
Object {
  "operations": Array [
    Object {
      "collectionName": "comments",
      "data": Object {
        "$push": Object {
          "userIds": Object {
            "$each": ResultPromise {
              "source": Array [
                "Operation-1",
                Distinct {
                  "path": "_id",
                },
              ],
            },
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
      "output": ResultPromise {
        "source": Array [
          "Operation-0",
        ],
      },
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
      "output": ResultPromise {
        "source": Array [
          "Operation-1",
        ],
      },
    },
  ],
}
`);
  });
});
