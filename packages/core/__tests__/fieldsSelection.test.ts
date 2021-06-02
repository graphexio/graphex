import * as DirectiveImplements from '@graphex/directive-implements';
import gql from 'graphql-tag';
import AMM from '../src';
import { AMVisitor } from '../src/execution/visitor';
import { AMTransaction } from '../src/execution/transaction';

const generateSchema = typeDefs => {
  return new AMM({}).makeExecutableSchema({
    resolverValidationOptions: {
      requireResolversForResolveType: false,
    },
    typeDefs: [typeDefs, DirectiveImplements.typeDefs],
    schemaDirectives: {
      ...DirectiveImplements.schemaDirectives,
    },
  });
};

describe('simple schema', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
    }
  `);

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
    AMVisitor.visit(schema, rq, {}, transaction);
    expect(transaction.operations[0].fieldsSelection).toMatchInlineSnapshot(`
                  Object {
                    "fields": Array [
                      "_id",
                      "title",
                    ],
                  }
            `);
  });
});

describe('nested objects', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      comments: [Comment]
    }

    type Comment @embedded {
      message: String
      childComments: [Comment]
    }
  `);

  test('select fields', () => {
    const rq = gql`
      {
        posts {
          id
          title
          comments {
            message
            childComments {
              message
            }
          }
        }
      }
    `;

    const transaction = new AMTransaction();
    AMVisitor.visit(schema, rq, {}, transaction);
    expect(transaction.operations[0].fieldsSelection).toMatchInlineSnapshot(`
                    Object {
                      "fields": Array [
                        "_id",
                        "title",
                        "comments.message",
                        "comments.childComments.message",
                      ],
                    }
              `);
  });
});
