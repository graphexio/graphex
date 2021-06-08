import gql from 'graphql-tag';
import { prepareTransaction } from '../utils/prepareTransaction';
import Core from '../../src';

import Serializer from '../../src/serializer';
expect.addSnapshotSerializer(Serializer);

describe('abstract interface', () => {
  const schema = new Core().makeExecutableSchema({
    typeDefs: gql`
      type Item {
        id: ID @unique
      }

      type Collection @model {
        id: ID @id @unique
        title: String
        items: [Item] @relationOutside
        item: Item @relationOutside
      }
    `,
  });

  test('create relation', () => {
    const rq = gql`
      mutation {
        createCollection(
          data: {
            title: "test"
            items: { connect: [{ id: "test-id1" }, { id: "test-id2" }] }
            item: { connect: { id: "test-id" } }
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
            "collectionName": "collections",
            "data": Object {
              "item": Object {
                "id": "test-id",
              },
              "items": Array [
                Object {
                  "id": "test-id1",
                },
                Object {
                  "id": "test-id2",
                },
              ],
              "title": "test",
            },
            "fieldsSelection": Object {
              "fields": Array [
                "id",
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

  describe('update relation', () => {
    test('connect', () => {
      const rq = gql`
        mutation {
          updateCollection(
            where: { id: "parent-id" }
            data: {
              title: "test"
              items: { connect: [{ id: "test-id1" }, { id: "test-id2" }] }
              item: { connect: { id: "test-id" } }
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
                    "collectionName": "collections",
                    "data": Object {
                      "$push": Object {
                        "items": Object {
                          "$each": Array [
                            Object {
                              "id": "test-id1",
                            },
                            Object {
                              "id": "test-id2",
                            },
                          ],
                        },
                      },
                      "$set": Object {
                        "item": Object {
                          "id": "test-id",
                        },
                        "title": "test",
                      },
                    },
                    "fieldsSelection": Object {
                      "fields": Array [
                        "id",
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
                      "id": "parent-id",
                    },
                  },
                ],
              }
          `);
    });

    test('reconnect', () => {
      const rq = gql`
        mutation {
          updateCollection(
            where: { id: "parent-id" }
            data: {
              title: "test"
              items: { reconnect: [{ id: "test-id1" }, { id: "test-id2" }] }
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
              "collectionName": "collections",
              "data": Object {
                "$set": Object {
                  "items": Array [
                    Object {
                      "id": "test-id1",
                    },
                    Object {
                      "id": "test-id2",
                    },
                  ],
                  "title": "test",
                },
              },
              "fieldsSelection": Object {
                "fields": Array [
                  "id",
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
                "id": "parent-id",
              },
            },
          ],
        }
      `);
    });

    test('disconnect', () => {
      const rq = gql`
        mutation {
          updateCollection(
            where: { id: "parent-id" }
            data: {
              title: "test"
              items: { disconnect: [{ id: "test-id1" }, { id: "test-id2" }] }
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
              "collectionName": "collections",
              "data": Object {
                "$pullAll": Object {
                  "items": Array [
                    Object {
                      "id": "test-id1",
                    },
                    Object {
                      "id": "test-id2",
                    },
                  ],
                },
                "$set": Object {
                  "title": "test",
                },
              },
              "fieldsSelection": Object {
                "fields": Array [
                  "id",
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
                "id": "parent-id",
              },
            },
          ],
        }
      `);
    });

    test('update relation field only', () => {
      const rq = gql`
        mutation {
          updateCollection(
            where: { id: "parent-id" }
            data: {
              items: { disconnect: [{ id: "test-id1" }, { id: "test-id2" }] }
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
              "collectionName": "collections",
              "data": Object {
                "$pullAll": Object {
                  "items": Array [
                    Object {
                      "id": "test-id1",
                    },
                    Object {
                      "id": "test-id2",
                    },
                  ],
                },
              },
              "fieldsSelection": Object {
                "fields": Array [
                  "id",
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
                "id": "parent-id",
              },
            },
          ],
        }
      `);
    });

    test('reconnect', () => {
      const rq = gql`
        mutation {
          updateCollection(
            where: { id: "parent-id" }
            data: {
              items: { reconnect: [{ id: "test-id1" }, { id: "test-id2" }] }
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
              "collectionName": "collections",
              "data": Object {
                "$set": Object {
                  "items": Array [
                    Object {
                      "id": "test-id1",
                    },
                    Object {
                      "id": "test-id2",
                    },
                  ],
                },
              },
              "fieldsSelection": Object {
                "fields": Array [
                  "id",
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
                "id": "parent-id",
              },
            },
          ],
        }
      `);
    });
  });
});
