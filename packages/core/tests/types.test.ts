import * as DirectiveImplements from '@apollo-model/directive-implements';
import gql from 'graphql-tag';
import AMM from '../src';
import { applyInputTransform } from '../src/inputTypes/utils';
import { printType } from 'graphql';

const generateSchema = typeDefs => {
  return new AMM({ queryExecutor: null }).makeExecutableSchema({
    resolverValidationOptions: {
      requireResolversForResolveType: false,
    },
    typeDefs,
  });
};

describe('orderBy', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      pinnedComment: Comment
      comments: [Comment!]
    }

    type Comment @embedded {
      message: String
    }
  `);

  const orderByType = schema.getType('PostOrderByInput');

  test('schema', () => {
    expect(printType(orderByType)).toMatchInlineSnapshot(`
                                          "enum PostOrderByInput {
                                            id_ASC
                                            id_DESC
                                            title_ASC
                                            title_DESC
                                          }"
                            `);
  });

  test('values', () => {
    expect(orderByType.toConfig()).toMatchInlineSnapshot(`
                              Object {
                                "astNode": undefined,
                                "description": undefined,
                                "extensionASTNodes": Array [],
                                "name": "PostOrderByInput",
                                "values": Object {
                                  "id_ASC": Object {
                                    "astNode": undefined,
                                    "deprecationReason": undefined,
                                    "description": undefined,
                                    "value": Object {
                                      "_id": 1,
                                    },
                                  },
                                  "id_DESC": Object {
                                    "astNode": undefined,
                                    "deprecationReason": undefined,
                                    "description": undefined,
                                    "value": Object {
                                      "_id": -1,
                                    },
                                  },
                                  "title_ASC": Object {
                                    "astNode": undefined,
                                    "deprecationReason": undefined,
                                    "description": undefined,
                                    "value": Object {
                                      "title": 1,
                                    },
                                  },
                                  "title_DESC": Object {
                                    "astNode": undefined,
                                    "deprecationReason": undefined,
                                    "description": undefined,
                                    "value": Object {
                                      "title": -1,
                                    },
                                  },
                                },
                              }
                    `);
  });
});

describe('where', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
    }
  `);

  const postWhereInputType = schema.getType('PostWhereInput');

  test('schema', () => {
    expect(printType(postWhereInputType)).toMatchInlineSnapshot(`
      "input PostWhereInput {
        AND: [PostWhereInput]
        OR: [PostWhereInput]
        id_exists: Boolean
        id_in: [ID]
        id_not_in: [ID]
        id: ID
        id_not: ID
        title_exists: Boolean
        title_in: [String]
        title_not_in: [String]
        title: String
        title_lt: String
        title_lte: String
        title_gt: String
        title_gte: String
        title_not: String
        title_contains: String
        title_starts_with: String
        title_ends_with: String
      }"
    `);
  });
});
