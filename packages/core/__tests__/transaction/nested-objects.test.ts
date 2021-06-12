import gql from 'graphql-tag';
import { generateSchema } from './generateSchema';
import { prepareTransaction } from '../utils/prepareTransaction';

describe('nested objects', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      comments: [Comment]! @subdocument
      pinnedComment: Comment @subdocument
    }

    type Comment {
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

    const transaction = prepareTransaction(schema, rq);
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
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
            },
          },
        ],
      }
    `);
  });

  test('where nested', () => {
    const rq = gql`
      query($where: PostWhereInput) {
        posts(where: $where) {
          id
        }
      }
    `;

    const transaction = prepareTransaction(schema, rq, {
      where: { comments_some: { message_contains: 'test' } },
    });
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
      "output": ResultPromise {
        "source": Array [
          "Operation-0",
        ],
      },
      "selector": Object {
        "comments": Object {
          Symbol(some): Object {
            "message": Object {
              Symbol(contains): "test",
            },
          },
        },
      },
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

    const transaction = prepareTransaction(schema, rq);
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
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
            },
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

    const transaction = prepareTransaction(schema, rq);
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
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
            },
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

    const transaction = prepareTransaction(schema, rq);
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

    const transaction = prepareTransaction(schema, rq);
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

    const transaction = prepareTransaction(schema, rq);
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
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
            },
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

    const transaction = prepareTransaction(schema, rq);
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
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
            },
            "selector": Object {
              "_id": "PostId",
            },
          },
        ],
      }
    `);
  });
});
