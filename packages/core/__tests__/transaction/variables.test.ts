import gql from 'graphql-tag';
import { AMVisitor } from '../../src/execution/visitor';
import { AMTransaction } from '../../src/execution/transaction';

import { buildFederatedSchema } from './buildFederatedSchema';

describe('variables', () => {
  const schema = buildFederatedSchema(gql`
    scalar Content

    type EmbeddedContent {
      content: Content
    }

    type Post @model {
      id: ID @id @unique @db(name: "_id")
      content: Content
      contents: [Content!]
      embeddedContent: EmbeddedContent @subdocument
    }
  `);

  test('object variable', () => {
    const rq = gql`
      mutation createPost(
        $embeddedContent: EmbeddedContentCreateOneNestedInput
      ) {
        createPost(data: { embeddedContent: $embeddedContent }) {
          id
        }
      }
    `;
    const variables = {
      embeddedContent: {
        create: { content: { body: 'body', tags: ['tag1', 'tag2'] } },
      },
    };

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, variables, transaction);
    expect(transaction).toMatchInlineSnapshot(`
      Object {
        "operations": Array [
          Object {
            "collectionName": "posts",
            "data": Object {
              "embeddedContent": Object {
                "content": Object {
                  "body": "body",
                  "tags": Array [
                    "tag1",
                    "tag2",
                  ],
                },
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
        ],
      }
    `);
  });

  test('scalar variable', () => {
    const rq = gql`
      mutation createPost($content: Content) {
        createPost(data: { content: $content }) {
          id
        }
      }
    `;
    const variables = { content: { body: 'body', tags: ['tag1', 'tag2'] } };

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, variables, transaction);
    expect(transaction).toMatchInlineSnapshot(`
      Object {
        "operations": Array [
          Object {
            "collectionName": "posts",
            "data": Object {
              "content": Object {
                "body": "body",
                "tags": Array [
                  "tag1",
                  "tag2",
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
        ],
      }
    `);
  });

  test('array of scalars variable', () => {
    const rq = gql`
      mutation createPost($contents: [Content!]!) {
        createPost(data: { contents: $contents }) {
          id
        }
      }
    `;
    const variables = { contents: [{ body: 'body', tags: ['tag1', 'tag2'] }] };

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, variables, transaction);
    expect(transaction).toMatchInlineSnapshot(`
      Object {
        "operations": Array [
          Object {
            "collectionName": "posts",
            "data": Object {
              "contents": Array [
                Object {
                  "body": "body",
                  "tags": Array [
                    "tag1",
                    "tag2",
                  ],
                },
              ],
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
