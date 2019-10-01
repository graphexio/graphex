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
    AMVisitor.visit(schema, rq, transaction);
    expect(transaction).toMatchInlineSnapshot(`
            AMTransaction {
              "operations": Array [
                AMReadOperation {
                  "collectionName": "posts",
                  "fieldsSelection": AMFieldsSelectionContext {
                    "fields": Array [
                      "_id",
                      "title",
                    ],
                  },
                  "selector": undefined,
                },
              ],
            }
        `);
  });

  test('select fields', () => {
    const rq = gql`
      {
        posts {
          id
          title
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, transaction);
    expect(transaction.operations[0].fieldsSelection).toMatchInlineSnapshot(`
                  AMFieldsSelectionContext {
                    "fields": Array [
                      "_id",
                      "title",
                    ],
                  }
            `);
  });

  test('where', () => {
    const rq = gql`
      {
        posts(where: { title: "test-title", id: "testIdentifier" }) {
          id
          title
        }
      }
    `;

    const transaction = new AMTransaction();

    AMVisitor.visit(schema, rq, transaction);
    expect(transaction.operations[0].selector).toMatchInlineSnapshot(`
      AMSelectorContext {
        "selector": Object {
          "_id": "testIdentifier",
          "title": "test-title",
        },
      }
    `);
  });
});
