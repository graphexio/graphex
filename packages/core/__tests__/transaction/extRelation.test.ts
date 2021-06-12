import gql from 'graphql-tag';
import { generateSchema } from './generateSchema';
import { prepareTransaction } from '../utils/prepareTransaction';

import Serializer from '../../src/serializer';
expect.addSnapshotSerializer(Serializer);

describe('extRelation', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      comments: [Comment] @extRelation
      lastComment: Comment @extRelation
    }

    type Comment @model {
      id: ID @id @unique @db(name: "_id")
      post: Post @relation
      message: String
    }

    type Nested {
      id: ID @db(name: "_id")
      comment: Comment @extRelation(storeField: "postId", field: "_id")
    }

    type Favorites @model {
      id: ID @id @unique @db(name: "_id")
      nested: Nested
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

    const transaction = prepareTransaction(schema, rq);
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
          },
          Object {
            "collectionName": "comments",
            "fieldsSelection": Object {
              "fields": Array [
                "postId",
                "message",
              ],
            },
            "identifier": "Operation-1",
            "kind": "AMReadOperation",
            "many": true,
            "output": ResultPromise {
              "source": Array [
                "Operation-1",
                GroupBy {
                  "params": Object {
                    "groupingField": "postId",
                  },
                },
              ],
            },
            "selector": Object {
              "postId": Object {
                Symbol(in): ResultPromise {
                  "source": "<Batch>",
                },
              },
            },
          },
        ],
      }
    `);
  });

  test('extRelation single', () => {
    const rq = gql`
      {
        posts {
          lastComment {
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
          },
          Object {
            "collectionName": "comments",
            "fieldsSelection": Object {
              "fields": Array [
                "postId",
                "_id",
              ],
            },
            "identifier": "Operation-1",
            "kind": "AMReadOperation",
            "many": true,
            "output": ResultPromise {
              "source": Array [
                "Operation-1",
                GroupBy {
                  "params": Object {
                    "groupingField": "postId",
                  },
                },
              ],
            },
            "selector": Object {
              "postId": Object {
                Symbol(in): ResultPromise {
                  "source": "<Batch>",
                },
              },
            },
          },
        ],
      }
    `);
  });

  test('extRelation nested single', () => {
    const rq = gql`
      {
        favorites {
          nested {
            comment {
              id
            }
          }
        }
      }
    `;

    const transaction = prepareTransaction(schema, rq);
    expect(transaction).toMatchInlineSnapshot(`
      Object {
        "operations": Array [
          Object {
            "collectionName": "favorites",
            "fieldsSelection": Object {
              "fields": Array [
                "nested._id",
              ],
            },
            "identifier": "Operation-0",
            "kind": "AMReadOperation",
            "many": false,
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
            },
          },
          Object {
            "collectionName": "comments",
            "fieldsSelection": Object {
              "fields": Array [
                "postId",
                "_id",
              ],
            },
            "identifier": "Operation-1",
            "kind": "AMReadOperation",
            "many": true,
            "output": ResultPromise {
              "source": Array [
                "Operation-1",
                GroupBy {
                  "params": Object {
                    "groupingField": "postId",
                  },
                },
              ],
            },
            "selector": Object {
              "postId": Object {
                Symbol(in): ResultPromise {
                  "source": "<Batch>",
                },
              },
            },
          },
        ],
      }
    `);
  });

  // test('request parent collection from extRelation', () => {
  //   const rq = gql`
  //     {
  //       posts {
  //         comments {
  //           post {
  //             id
  //           }
  //         }
  //       }
  //     }
  //   `;

  //   const transaction = prepareTransaction(schema, rq);
  //   expect(transaction).toMatchInlineSnapshot(`

  // `);
  // });
});
