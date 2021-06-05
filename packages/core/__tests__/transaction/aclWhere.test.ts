import gql from 'graphql-tag';

import { generateSchema } from './generateSchema';
import { prepareTransaction } from './prepareTransaction';

import Serializer from '../../src/serializer';
expect.addSnapshotSerializer(Serializer);

describe('aclWhere', () => {
  const schema = generateSchema(
    gql`
      type Post @model {
        id: ID @id @unique @db(name: "_id")
        title: String
        comments: [Comment]!
        pinnedComment: Comment
      }

      interface Comment
      type TextComment implements Comment {
        message: String
      }

      type AttachmentComment implements Comment {
        path: String
      }

      interface User @model @inherit {
        id: ID @id @unique @db(name: "_id")
        username: String
      }

      type Admin implements User {
        title: String
      }
    `,
    { aclWhere: true }
  );

  test('read many', () => {
    const rq = gql`
      query {
        posts(where: { title: "title1", aclWhere: { title: "title2" } }) {
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
              "$and": Array [
                Object {
                  "title": "title1",
                },
                Object {
                  "title": "title2",
                },
              ],
            },
          },
        ],
      }
    `);
  });

  test('interface', () => {
    const rq = gql`
      query {
        users(
          where: { Admin: { title: "title" }, aclWhere: { username: "str-2" } }
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
        "$and": Array [
          Object {
            "_type": "admin",
            "title": "title",
          },
          Object {
            "username": "str-2",
          },
        ],
      },
    },
  ],
}
`);
  });
});
