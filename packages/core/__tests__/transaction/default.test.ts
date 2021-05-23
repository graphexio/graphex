import gql from 'graphql-tag';
import { generateSchema } from './generateSchema';
import { prepareTransaction } from './prepareTransaction';

import Serializer from '../../src/serializer';
expect.addSnapshotSerializer(Serializer);

describe('default', () => {
  const schema = generateSchema(
    gql`
      enum Column {
        left
        right
      }

      type Post @model {
        id: ID @id @unique @db(name: "_id")
        title: String! @default(value: "New post")
        priority: Int @default(value: 1)
        column: Column @default(value: left)
      }
    `
  );

  test('create with empty default', () => {
    const rq = gql`
      mutation {
        createPost(data: {}) {
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
              "column": "left",
              "priority": 1,
              "title": "New post",
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
        ],
      }
    `);
  });

  test('create with filled default', () => {
    const rq = gql`
      mutation {
        createPost(data: { title: "Post", priority: 0, column: right }) {
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
        "column": "right",
        "priority": 0,
        "title": "Post",
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
  ],
}
`);
  });
});
