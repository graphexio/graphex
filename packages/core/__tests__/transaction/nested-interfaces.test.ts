import gql from 'graphql-tag';
import { generateSchema } from './generateSchema';
import { prepareTransaction } from './prepareTransaction';

describe('nested interfaces', () => {
  const schema = generateSchema(gql`
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
  `);

  test('create', () => {
    const rq = gql`
      mutation {
        createPost(
          data: {
            title: "test-title"
            pinnedComment: { create: { TextComment: { message: "comment-1" } } }
          }
        ) {
          id
          title
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
              "pinnedComment": Object {
                "_type": "textComment",
                "message": "comment-1",
              },
              "title": "test-title",
            },
            "fieldsSelection": Object {
              "fields": Array [
                "_id",
                "title",
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
