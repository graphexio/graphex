import gql from 'graphql-tag';
import { generateSchema } from './generateSchema';
import { prepareTransaction } from './prepareTransaction';

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
          DistinctReplace {
            "conditions": Array [
              Map {},
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-1",
              ],
            },
            "displayField": "$mainCategory",
            "path": "",
            "relationField": "_id",
            "storeField": "categoryId",
          },
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
        ],
      },
      "selector": Object {
        "_id": Object {
          "$in": ResultPromise {
            "source": Array [
              "Operation-0",
              Distinct {
                "path": "categoryId",
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
          Lookup {
            "conditions": Array [
              Map {},
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-1",
              ],
            },
            "displayFieldPath": "$firstComment",
            "many": true,
            "path": "",
            "relationField": "_id",
            "storeField": "postId",
          },
          Lookup {
            "conditions": Array [
              Map {},
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-2",
              ],
            },
            "displayFieldPath": "$secondComment",
            "many": true,
            "path": "",
            "relationField": "_id",
            "storeField": "postId",
          },
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
          DistinctReplace {
            "conditions": Array [
              Map {},
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-1",
              ],
            },
            "displayField": "post",
            "path": "",
            "relationField": "_id",
            "storeField": "postId",
          },
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
        ],
      },
      "selector": Object {
        "_id": Object {
          "$in": ResultPromise {
            "source": Array [
              "Operation-0",
              Distinct {
                "path": "postId",
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
          DistinctReplace {
            "conditions": Array [
              Map {},
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-1",
              ],
            },
            "displayField": "post",
            "path": "",
            "relationField": "_id",
            "storeField": "postId",
          },
          DistinctReplace {
            "conditions": Array [
              Map {},
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-2",
              ],
            },
            "displayField": "category",
            "path": "post",
            "relationField": "_id",
            "storeField": "categoryId",
          },
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
        ],
      },
      "selector": Object {
        "_id": Object {
          "$in": ResultPromise {
            "source": Array [
              "Operation-0",
              Distinct {
                "path": "postId",
              },
            ],
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
        ],
      },
      "selector": Object {
        "_id": Object {
          "$in": ResultPromise {
            "source": Array [
              "Operation-1",
              Distinct {
                "path": "categoryId",
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
          DistinctReplace {
            "conditions": Array [
              Map {},
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-1",
              ],
            },
            "displayField": "post",
            "path": "",
            "relationField": "_id",
            "storeField": "postId",
          },
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
        ],
      },
      "selector": Object {
        "_id": Object {
          "$in": ResultPromise {
            "source": Array [
              "Operation-0",
              Distinct {
                "path": "postId",
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
          DistinctReplace {
            "conditions": Array [
              Map {
                "" => "RootComment",
              },
              Map {
                "" => "SubComment",
              },
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-1",
              ],
            },
            "displayField": "post",
            "path": "",
            "relationField": "_id",
            "storeField": "postId",
          },
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
        ],
      },
      "selector": Object {
        "_id": Object {
          "$in": ResultPromise {
            "source": Array [
              "Operation-0",
              Distinct {
                "path": "postId",
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
          DistinctReplace {
            "conditions": Array [
              Map {
                "" => "RootComment",
              },
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-1",
              ],
            },
            "displayField": "post",
            "path": "",
            "relationField": "_id",
            "storeField": "postId",
          },
          DistinctReplace {
            "conditions": Array [
              Map {
                "" => "SubComment",
              },
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-2",
              ],
            },
            "displayField": "post",
            "path": "",
            "relationField": "_id",
            "storeField": "postId",
          },
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
        ],
      },
      "selector": Object {
        "_id": Object {
          "$in": ResultPromise {
            "source": Array [
              "Operation-0",
              Distinct {
                "path": "postId",
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
          DistinctReplace {
            "conditions": Array [
              Map {},
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-1",
              ],
            },
            "displayField": "post",
            "path": "",
            "relationField": "_id",
            "storeField": "postId",
          },
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
        ],
      },
      "selector": Object {
        "_id": Object {
          "$in": ResultPromise {
            "source": Array [
              "Operation-0",
              Distinct {
                "path": "postId",
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
          DistinctReplace {
            "conditions": Array [
              Map {},
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-1",
              ],
            },
            "displayField": "post",
            "path": "",
            "relationField": "_id",
            "storeField": "postId",
          },
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
        ],
      },
      "selector": Object {
        "_id": Object {
          "$in": ResultPromise {
            "source": Array [
              "Operation-0",
              Distinct {
                "path": "postId",
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
          DistinctReplace {
            "conditions": Array [
              Map {},
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-1",
              ],
            },
            "displayField": "post",
            "path": "",
            "relationField": "_id",
            "storeField": "postId",
          },
          DistinctReplace {
            "conditions": Array [
              Map {
                "" => "RootComment",
              },
              Map {
                "" => "SubComment",
              },
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-2",
              ],
            },
            "displayField": "category",
            "path": "post",
            "relationField": "_id",
            "storeField": "categoryId",
          },
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
        ],
      },
      "selector": Object {
        "_id": Object {
          "$in": ResultPromise {
            "source": Array [
              "Operation-0",
              Distinct {
                "path": "postId",
              },
            ],
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
        ],
      },
      "selector": Object {
        "_id": Object {
          "$in": ResultPromise {
            "source": Array [
              "Operation-1",
              Distinct {
                "path": "categoryId",
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
          DistinctReplace {
            "conditions": Array [
              Map {},
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-1",
              ],
            },
            "displayField": "post",
            "path": "",
            "relationField": "_id",
            "storeField": "postId",
          },
          DistinctReplace {
            "conditions": Array [
              Map {
                "" => "RootComment",
              },
              Map {
                "" => "SubComment",
              },
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-2",
              ],
            },
            "displayField": "category",
            "path": "post",
            "relationField": "_id",
            "storeField": "categoryId",
          },
          DistinctReplace {
            "conditions": Array [
              Map {
                "" => "RootComment",
                "post.category" => "SubCategory",
              },
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-3",
              ],
            },
            "displayField": "parentCategory",
            "path": "post.category",
            "relationField": "_id",
            "storeField": "categoryId",
          },
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
        ],
      },
      "selector": Object {
        "_id": Object {
          "$in": ResultPromise {
            "source": Array [
              "Operation-0",
              Distinct {
                "path": "postId",
              },
            ],
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
        ],
      },
      "selector": Object {
        "_id": Object {
          "$in": ResultPromise {
            "source": Array [
              "Operation-1",
              Distinct {
                "path": "categoryId",
              },
            ],
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
        ],
      },
      "selector": Object {
        "_id": Object {
          "$in": ResultPromise {
            "source": Array [
              "Operation-2",
              Distinct {
                "path": "categoryId",
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
          DistinctReplace {
            "conditions": Array [
              Map {},
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-1",
              ],
            },
            "displayField": "post",
            "path": "",
            "relationField": "_id",
            "storeField": "postId",
          },
          DistinctReplace {
            "conditions": Array [
              Map {
                "" => "RootComment",
              },
              Map {
                "" => "SubComment",
              },
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-2",
              ],
            },
            "displayField": "category",
            "path": "post",
            "relationField": "_id",
            "storeField": "categoryId",
          },
          DistinctReplace {
            "conditions": Array [
              Map {
                "" => "RootComment",
                "post.category" => "SubCategory",
              },
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-3",
              ],
            },
            "displayField": "parentCategory",
            "path": "post.category",
            "relationField": "_id",
            "storeField": "categoryId",
          },
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
        ],
      },
      "selector": Object {
        "_id": Object {
          "$in": ResultPromise {
            "source": Array [
              "Operation-0",
              Distinct {
                "path": "postId",
              },
            ],
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
        ],
      },
      "selector": Object {
        "_id": Object {
          "$in": ResultPromise {
            "source": Array [
              "Operation-1",
              Distinct {
                "path": "categoryId",
              },
            ],
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
        ],
      },
      "selector": Object {
        "_id": Object {
          "$in": ResultPromise {
            "source": Array [
              "Operation-2",
              Distinct {
                "path": "categoryId",
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
          DistinctReplace {
            "conditions": Array [
              Map {},
            ],
            "data": ResultPromise {
              "source": Array [
                "Operation-1",
              ],
            },
            "displayField": "post",
            "path": "",
            "relationField": "_id",
            "storeField": "postId",
          },
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
        ],
      },
      "selector": Object {
        "_id": Object {
          "$in": ResultPromise {
            "source": Array [
              "Operation-0",
              Distinct {
                "path": "postId",
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
