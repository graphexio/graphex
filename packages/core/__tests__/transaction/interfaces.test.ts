import gql from 'graphql-tag';
import { generateSchema } from './generateSchema';
import { prepareTransaction } from './prepareTransaction';

import Serializer from '../../src/serializer';
expect.addSnapshotSerializer(Serializer);

describe('interfaces', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      owner: User @relation
      ownerRequired: User! @relation(storeField: "ownerRequiredUserId")
    }

    interface User @model @inherit {
      id: ID @id @unique @db(name: "_id")
      profile: Profile
    }

    interface Profile @inherit @embedded {
      invitedBy: User @relation
    }

    type Admin implements User {
      username: String
      approves: [Post] @relation(storeField: "approvesPostIds")
      profile: AdminProfile
    }

    type AdminProfile implements Profile @embedded {
      name: String
    }

    type Subscriber implements User {
      profile: SubscriberProfile
      likes: [Post] @relation(storeField: "likesPostIds")
    }

    type SubscriberProfile implements Profile @embedded {
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

    const transaction = prepareTransaction(schema, rq);
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
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
            },
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

    const transaction = prepareTransaction(schema, rq);
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
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
            },
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

    const transaction = prepareTransaction(schema, rq);
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
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
            },
            "selector": Object {
              "_type": "admin",
            },
          },
        ],
      }
    `);
  });
  test('interface where', () => {
    const rq = gql`
      query {
        users(
          where: { User: { profile: { SubscriberProfile: { name: "test" } } } }
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
            "collectionName": "users",
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
              "profile._type": "subscriberProfile",
              "profile.name": "test",
            },
          },
        ],
      }
    `);
  });

  test('interface where specific type', () => {
    const rq = gql`
      query {
        users(where: { Subscriber: { profile: { name: "test" } } }) {
          id
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
            "many": true,
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
            },
            "selector": Object {
              "_type": "subscriber",
              "profile.name": "test",
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

    const transaction = prepareTransaction(schema, rq);
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
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
            },
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

    const transaction = prepareTransaction(schema, rq);
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
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
            },
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

    const transaction = prepareTransaction(schema, rq);
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
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
            },
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

    const transaction = prepareTransaction(schema, rq);
    expect(transaction).toMatchInlineSnapshot(`
      Object {
        "operations": Array [
          Object {
            "collectionName": "users",
            "identifier": "Operation-0",
            "kind": "AMDeleteOperation",
            "many": true,
            "output": ResultPromise {
              "source": Array [
                "Operation-0",
              ],
            },
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
            ownerRequired: { create: { Admin: { username: "new admin" } } }
          }
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
            "collectionName": "posts",
            "data": Object {
              "ownerRequiredUserId": ResultPromise {
                "source": Array [
                  "Operation-2",
                  Path {
                    "path": "_id",
                  },
                ],
              },
              "title": "post title",
              "userId": ResultPromise {
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
            "collectionName": "users",
            "data": Object {
              "_type": "admin",
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
            "collectionName": "users",
            "data": Object {
              "_type": "admin",
              "username": "new admin",
            },
            "identifier": "Operation-2",
            "kind": "AMCreateOperation",
            "many": false,
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

  test('connect relation', () => {
    const rq = gql`
      mutation {
        createPost(
          data: {
            title: "post title"
            owner: { connect: { User: { id: "admin-id" } } }
            ownerRequired: { connect: { User: { id: "admin-id" } } }
          }
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
            "collectionName": "posts",
            "data": Object {
              "ownerRequiredUserId": ResultPromise {
                "source": Array [
                  "Operation-2",
                  Path {
                    "path": "_id",
                  },
                ],
              },
              "title": "post title",
              "userId": ResultPromise {
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
            "collectionName": "users",
            "identifier": "Operation-1",
            "kind": "AMReadOperation",
            "many": false,
            "output": ResultPromise {
              "source": Array [
                "Operation-1",
              ],
            },
            "selector": Object {
              "_id": "admin-id",
            },
          },
          Object {
            "collectionName": "users",
            "identifier": "Operation-2",
            "kind": "AMReadOperation",
            "many": false,
            "output": ResultPromise {
              "source": Array [
                "Operation-2",
              ],
            },
            "selector": Object {
              "_id": "admin-id",
            },
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

    const transaction = prepareTransaction(schema, rq);
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
    const transaction = prepareTransaction(schema, rq);
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
      "output": ResultPromise {
        "source": Array [
          "Operation-2",
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

  test('relations in embedded interfaces', () => {
    const rq = gql`
      query {
        users {
          profile {
            invitedBy {
              id
            }
          }
        }
      }
    `;

    //TODO: Fix filtering distinct and distinctReplace
    const transaction = prepareTransaction(schema, rq);
    expect(transaction).toMatchInlineSnapshot(`
Object {
  "operations": Array [
    Object {
      "collectionName": "users",
      "fieldsSelection": Object {
        "fields": Array [
          "profile.userId",
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
      "collectionName": "users",
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
});
