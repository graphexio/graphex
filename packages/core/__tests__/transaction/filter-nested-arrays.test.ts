import gql from 'graphql-tag';
import { generateSchema } from './generateSchema';
import { prepareTransaction } from '../utils/prepareTransaction';

import Serializer from '../../src/serializer';
expect.addSnapshotSerializer(Serializer);

describe('filter nested arrays', () => {
  const schema = generateSchema(
    gql`
      type Post @model {
        id: ID @id @unique @db(name: "_id")
        comments: [Comment] @subdocument
      }

      type Comment {
        message: String
        comments: [Comment] @subdocument
      }
    `
  );

  test('string match', () => {
    const rq = gql`
      {
        posts {
          id
          comments(where: { message: "test" }) {
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
          "comments.message",
        ],
      },
      "identifier": "Operation-0",
      "kind": "AMReadOperation",
      "many": true,
      "output": ResultPromise {
        "source": Array [
          "Operation-0",
          TransformArray {
            "displayField": "comments",
            "filterParams": Object {
              "where": Object {
                "message": "test",
              },
            },
            "path": Array [],
            "storeField": "comments",
          },
        ],
      },
    },
  ],
}
`);
  });
});
