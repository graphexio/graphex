import gql from 'graphql-tag';
import { UserInputError } from 'apollo-server';
import { generateSchema } from './generateSchema';
import { prepareTransaction } from './prepareTransaction';

import Serializer from '../../src/serializer';
expect.addSnapshotSerializer(Serializer);

describe('relation Connection', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      owner: User @relation(storeField: "owner_id", field: "_id")
    }

    type User @model {
      id: ID @id @unique @db(name: "_id")
      username: String
      posts: [Post]
        @extRelation(storeField: "owner_id", field: "_id", many: true)
    }
  `);

  test('Connection total count', () => {
    const rq = gql`
      {
        user(where: { id: 2 }) {
          id
          postsConnection {
            totalCount
          }
        }
      }
    `;
    const transaction = prepareTransaction(schema, rq);
    expect(transaction).toMatchInlineSnapshot(`
Object {
  "operations": Array [
    Object {
      "collectionName": "users",
      "fieldsSelection": Object {
        "fields": Array [
          "_id",
        ],
      },
      "identifier": "Operation-0",
      "kind": "AMReadOperation",
      "many": false,
      "output": ResultPromise {
        "source": Array [
          "Operation-0",
          Lookup {
            "conditions": Array [
              Map {},
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-2",
              ],
            },
            "displayFieldPath": "postsConnection.totalCount",
            "many": false,
            "path": "",
            "relationField": "_id",
            "storeField": "owner_id",
          },
        ],
      },
      "selector": Object {
        "_id": "2",
      },
    },
    Object {
      "fieldsSelection": Object {
        "fields": Array [],
      },
      "identifier": "Operation-1",
      "kind": "AMConnectionOperation",
      "many": false,
      "output": ResultPromise {
        "source": Array [
          "Operation-1",
        ],
      },
    },
    Object {
      "collectionName": "posts",
      "fieldsSelection": Object {
        "fields": Array [
          "totalCount",
        ],
      },
      "groupBy": "owner_id",
      "identifier": "Operation-2",
      "kind": "AMAggregateOperation",
      "many": true,
      "output": ResultPromise {
        "source": Array [
          "Operation-2",
        ],
      },
      "selector": Object {
        "owner_id": Object {
          "$in": ResultPromise {
            "source": Array [
              "Operation-0",
              Distinct {
                "path": "_id",
              },
            ],
          },
        },
      },
    },
  ],
}
`);
  });

  test('Connection nodes', () => {
    const rq = gql`
      {
        user(where: { id: 2 }) {
          id
          postsConnection {
            nodes {
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
      "collectionName": "users",
      "fieldsSelection": Object {
        "fields": Array [
          "_id",
        ],
      },
      "identifier": "Operation-0",
      "kind": "AMReadOperation",
      "many": false,
      "output": ResultPromise {
        "source": Array [
          "Operation-0",
          Lookup {
            "conditions": Array [
              Map {},
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-2",
              ],
            },
            "displayFieldPath": "postsConnection.nodes",
            "many": true,
            "path": "",
            "relationField": "_id",
            "storeField": "owner_id",
          },
        ],
      },
      "selector": Object {
        "_id": "2",
      },
    },
    Object {
      "fieldsSelection": Object {
        "fields": Array [],
      },
      "identifier": "Operation-1",
      "kind": "AMConnectionOperation",
      "many": false,
      "output": ResultPromise {
        "source": Array [
          "Operation-1",
        ],
      },
    },
    Object {
      "collectionName": "posts",
      "fieldsSelection": Object {
        "fields": Array [
          "owner_id",
          "_id",
        ],
      },
      "identifier": "Operation-2",
      "kind": "AMReadOperation",
      "many": true,
      "output": ResultPromise {
        "source": Array [
          "Operation-2",
        ],
      },
      "selector": Object {
        "owner_id": Object {
          "$in": ResultPromise {
            "source": Array [
              "Operation-0",
              Distinct {
                "path": "_id",
              },
            ],
          },
        },
      },
    },
  ],
}
`);
  });
});
