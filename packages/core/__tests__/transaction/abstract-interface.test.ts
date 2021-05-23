import gql from 'graphql-tag';
import { generateSchema } from './generateSchema';
import { prepareTransaction } from './prepareTransaction';

import Serializer from '../../src/serializer';
expect.addSnapshotSerializer(Serializer);

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

    const transaction = prepareTransaction(schema, rq);
    expect(transaction).toMatchInlineSnapshot(`
      Object {
        "operations": Array [
          Object {
            "collectionName": "posts",
            "data": Object {
              "title": "post title",
              "userId": ResultPromise {
                "source": Array [
                  "Operation-1",
                  Path {
                    "path": "_id",
                  },
                  ToDbRef {
                    "collectionName": "admins",
                  },
                ],
              },
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
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
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
            "output": ResultPromise {
              "source": Array [
                "Operation-1",
              ],
            },
          },
          Object {
            "dbRefList": ResultPromise {
              "source": Array [
                "Operation-0",
                Distinct {
                  "path": "userId",
                },
              ],
            },
            "fieldsSelection": Object {
              "fields": Array [
                "_id",
              ],
            },
            "identifier": "Operation-2",
            "kind": "AMReadDBRefOperation",
            "many": true,
            "output": ResultPromise {
              "source": Array [
                "Operation-2",
              ],
            },
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

    const transaction = prepareTransaction(schema, rq);
    expect(transaction).toMatchInlineSnapshot(`
      Object {
        "operations": Array [
          Object {
            "collectionName": "posts",
            "data": Object {
              "title": "post title",
              "userIds": Array [
                ResultPromise {
                  "source": Array [
                    "Operation-1",
                    Path {
                      "path": "_id",
                    },
                    ToDbRef {
                      "collectionName": "admins",
                    },
                  ],
                },
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
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
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
            "output": ResultPromise {
              "source": Array [
                "Operation-1",
              ],
            },
          },
          Object {
            "dbRefList": ResultPromise {
              "source": Array [
                "Operation-0",
                Distinct {
                  "path": "userId",
                },
              ],
            },
            "fieldsSelection": Object {
              "fields": Array [
                "_id",
              ],
            },
            "identifier": "Operation-2",
            "kind": "AMReadDBRefOperation",
            "many": true,
            "output": ResultPromise {
              "source": Array [
                "Operation-2",
              ],
            },
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

    const transaction = prepareTransaction(schema, rq);
    expect(transaction.operations[0].data).toMatchInlineSnapshot(`
      Object {
        "title": "post title",
        "userIds": Array [
          ResultPromise {
            "source": Array [
              "Operation-1",
              Path {
                "path": "_id",
              },
              ToDbRef {
                "collectionName": "admins",
              },
            ],
          },
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

    const transaction = prepareTransaction(schema, rq);
    expect(transaction).toMatchInlineSnapshot(`
Object {
  "operations": Array [
    Object {
      "collectionName": "posts",
      "data": Object {
        "$push": Object {
          "userIds": Object {
            "$each": Array [
              ResultPromise {
                "source": Array [
                  "Operation-1",
                  Path {
                    "path": "_id",
                  },
                  ToDbRef {
                    "collectionName": "admins",
                  },
                ],
              },
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
      "output": ResultPromise {
        "source": Array [
          "Operation-0",
        ],
      },
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
      "output": ResultPromise {
        "source": Array [
          "Operation-1",
        ],
      },
    },
    Object {
      "dbRefList": ResultPromise {
        "source": Array [
          "Operation-0",
          Distinct {
            "path": "userId",
          },
        ],
      },
      "fieldsSelection": Object {
        "fields": Array [
          "_id",
        ],
      },
      "identifier": "Operation-2",
      "kind": "AMReadDBRefOperation",
      "many": true,
      "output": ResultPromise {
        "source": Array [
          "Operation-2",
        ],
      },
    },
    Object {
      "dbRefList": ResultPromise {
        "source": Array [
          "Operation-0",
          Distinct {
            "path": "userIds",
          },
        ],
      },
      "fieldsSelection": Object {
        "fields": Array [
          "_id",
        ],
      },
      "identifier": "Operation-3",
      "kind": "AMReadDBRefOperation",
      "many": true,
      "output": ResultPromise {
        "source": Array [
          "Operation-3",
        ],
      },
    },
  ],
}
`);
  });
});
