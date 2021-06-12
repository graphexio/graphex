import gql from 'graphql-tag';
import { generateSchema } from './generateSchema';
import { prepareTransaction } from '../utils/prepareTransaction';

import Serializer from '../../src/serializer';
expect.addSnapshotSerializer(Serializer);

describe('request merging', () => {
  const schema = generateSchema(
    gql`
      interface Category @inherit @model {
        id: ID @id @unique @db(name: "_id")
        title: String
      }

      type RootCategory implements Category {
        position: Int
      }
      type SubCategory implements Category {
        parentCategory: Category @relation
      }

      type Post @model {
        id: ID @id @unique @db(name: "_id")
        title: String
        category: Category @relation
        comments: [Comment] @extRelation(storeField: "postId")
      }

      interface Comment @inherit @model {
        id: ID @id @unique @db(name: "_id")
        body: String
        post: Post @relation
      }

      type RootComment implements Comment {
        message: String
      }

      type SubComment implements Comment {
        message: String
        parentComment: Comment @relation
      }
    `
  );

  test('repeat field with alias', () => {
    const rq = gql`
      {
        comments {
          id
          ID: id
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

  test('relation with aliases', () => {
    const rq = gql`
      {
        posts {
          id
          mainCategory: category {
            title
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
                "categoryId",
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
            "collectionName": "categories",
            "fieldsSelection": Object {
              "fields": Array [
                "_id",
                "title",
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

  test('multiple requests on same field with aliases', () => {
    const rq = gql`
      {
        posts {
          id
          firstComment: comments(where: { body: "test1" }) {
            body
          }
          secondComment: comments(where: { body: "test2" }) {
            body
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
                "body",
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
              "body": "test1",
            },
          },
          Object {
            "collectionName": "comments",
            "fieldsSelection": Object {
              "fields": Array [
                "postId",
                "body",
              ],
            },
            "identifier": "Operation-2",
            "kind": "AMReadOperation",
            "many": true,
            "output": ResultPromise {
              "source": Array [
                "Operation-2",
                GroupBy {
                  "params": Object {
                    "groupingField": "postId",
                  },
                },
              ],
            },
            "selector": Object {
              "body": "test2",
            },
          },
        ],
      }
    `);
  });

  test('repeat field', () => {
    const rq = gql`
      {
        comments {
          id
          id
          id
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
          ],
        }
    `);
  });

  test('repeat relation field', () => {
    const rq = gql`
      {
        comments {
          id
          post {
            id
          }
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

  test('repeat relation field with extended selection', () => {
    const rq = gql`
      {
        comments {
          id
          post {
            id
          }
          post {
            category {
              title
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
                "categoryId",
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
                Symbol(in): ResultPromise {
                  "source": "<Batch>",
                },
              },
            },
          },
          Object {
            "collectionName": "categories",
            "fieldsSelection": Object {
              "fields": Array [
                "_id",
                "title",
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

  test('fragment', () => {
    const rq = gql`
      {
        comments {
          id
          post {
            title
          }
          ... on RootComment {
            post {
              title
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
                "title",
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

  test('fragments with not intersecting conditions', () => {
    const rq = gql`
      {
        comments {
          id
          ... on RootComment {
            post {
              title
            }
          }
          ... on SubComment {
            post {
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
                "title",
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

  test('fragments with not intersecting conditions and different args', () => {
    const rq = gql`
      {
        comments {
          id
          ... on RootComment {
            post(where: { title: "test" }) {
              title
            }
          }
          ... on SubComment {
            post {
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
                "title",
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
              "title": "test",
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

  test('wildcard before fragments with not intersecting conditions', () => {
    const rq = gql`
      {
        comments {
          id
          post {
            title
          }
          ... on RootComment {
            post {
              title
            }
          }
          ... on SubComment {
            post {
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
                "title",
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

  test('wildcard after fragments with not intersecting conditions', () => {
    const rq = gql`
      {
        comments {
          id
          ... on RootComment {
            post {
              title
            }
          }
          ... on SubComment {
            post {
              id
            }
          }
          post {
            title
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
                "title",
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

  test('wildcard before fragments with not intersecting conditions with nested operations', () => {
    const rq = gql`
      {
        comments {
          id
          post {
            title
          }
          ... on RootComment {
            post {
              title
              category {
                title
              }
            }
          }
          ... on SubComment {
            post {
              id
              category {
                id
              }
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
                "title",
                "categoryId",
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
                Symbol(in): ResultPromise {
                  "source": "<Batch>",
                },
              },
            },
          },
          Object {
            "collectionName": "categories",
            "fieldsSelection": Object {
              "fields": Array [
                "_id",
                "title",
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

  test('multiple nested fragments', () => {
    const rq = gql`
      {
        comments {
          id
          post {
            title
          }
          ... on RootComment {
            post {
              title
              category {
                ... on SubCategory {
                  parentCategory {
                    id
                  }
                }
                title
              }
            }
          }
          ... on SubComment {
            post {
              id
              category {
                id
              }
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
          "title",
          "categoryId",
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
          Symbol(in): ResultPromise {
            "source": "<Batch>",
          },
        },
      },
    },
    Object {
      "collectionName": "categories",
      "fieldsSelection": Object {
        "fields": Array [
          "_id",
          "categoryId",
          "title",
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
          Symbol(in): ResultPromise {
            "source": "<Batch>",
          },
        },
      },
    },
    Object {
      "collectionName": "categories",
      "fieldsSelection": Object {
        "fields": Array [
          "_id",
        ],
      },
      "identifier": "Operation-3",
      "kind": "AMReadOperation",
      "many": true,
      "output": ResultPromise {
        "source": Array [
          "Operation-3",
          IndexBy {
            "params": Object {
              "groupingField": "_id",
            },
          },
        ],
      },
      "selector": Object {
        "_id": Object {
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

  test('multiple nested fragments', () => {
    const rq = gql`
      {
        comments {
          id
          post {
            title
          }
          ... on RootComment {
            post {
              title
              category {
                ... on SubCategory {
                  parentCategory {
                    id
                  }
                }
                title
              }
            }
          }
          ... on SubComment {
            post {
              id
              category {
                id
              }
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
          "title",
          "categoryId",
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
          Symbol(in): ResultPromise {
            "source": "<Batch>",
          },
        },
      },
    },
    Object {
      "collectionName": "categories",
      "fieldsSelection": Object {
        "fields": Array [
          "_id",
          "categoryId",
          "title",
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
          Symbol(in): ResultPromise {
            "source": "<Batch>",
          },
        },
      },
    },
    Object {
      "collectionName": "categories",
      "fieldsSelection": Object {
        "fields": Array [
          "_id",
        ],
      },
      "identifier": "Operation-3",
      "kind": "AMReadOperation",
      "many": true,
      "output": ResultPromise {
        "source": Array [
          "Operation-3",
          IndexBy {
            "params": Object {
              "groupingField": "_id",
            },
          },
        ],
      },
      "selector": Object {
        "_id": Object {
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
  test('multiple nested fragments', () => {
    const rq = gql`
      query {
        comments {
          id
          ...Post
        }
      }

      fragment Post on Comment {
        post {
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
      "fieldsSelection": Object {
        "fields": Array [
          "_id.postId",
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
});
