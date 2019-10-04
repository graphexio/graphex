import * as DirectiveImplements from '@apollo-model/directive-implements';
import gql from 'graphql-tag';
import AMM from '../src';
import { applyInputTransform } from '../src/inputTypes/utils';
import { AMVisitor } from '../src/execution/visitor';
import { AMTransaction } from '../src/execution/transaction';

const generateSchema = typeDefs => {
  return new AMM({
    queryExecutor: null,
  }).makeExecutableSchema({
    resolverValidationOptions: {
      requireResolversForResolveType: false,
    },
    typeDefs: [typeDefs, DirectiveImplements.typeDefs],
    schemaDirectives: {
      ...DirectiveImplements.schemaDirectives,
    },
  });
};

describe('simple tests', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
    }
  `);

  test('transaction', () => {
    const rq = gql`
      {
        posts {
          id
          title
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);
    expect(transaction).toMatchInlineSnapshot(`
                  Object {
                    "operations": Array [
                      Object {
                        "collectionName": "posts",
                        "fieldsSelection": Object {
                          "fields": Array [
                            "_id",
                            "title",
                          ],
                        },
                        "identifier": "Operation-0",
                        "kind": "AMReadOperation",
                        "output": "AMResultPromise { Operation-0 }",
                        "selector": undefined,
                      },
                    ],
                  }
            `);
  });
});

describe('relation', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
    }

    type Comment @model {
      id: ID @id @unique @db(name: "_id")
      post: Post @relation
      message: String
    }
  `);

  test('select fields', () => {
    const rq = gql`
      {
        comments {
          id
          post {
            id
          }
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);

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
            "output": "AMResultPromise { Operation-0 -> distinctReplace('postId', '_id', AMResultPromise { Operation-1 }) }",
            "selector": undefined,
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
            "output": "AMResultPromise { Operation-1 }",
            "selector": Object {
              "_id": Object {
                "$in": "AMResultPromise { Operation-0 -> distinct('postId') }",
              },
            },
          },
        ],
      }
    `);
  });
});
