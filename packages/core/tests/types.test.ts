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

describe('create', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      pinnedComment: Comment
      comments: [Comment!]
    }

    type Comment @embedded {
      message: String
      user: User @relation
    }

    type User @model {
      id: ID @id @unique @db(name: "_id")
      username: String
    }
  `);

  test('PostCreateInput', () => {
    expect(printType(schema.getType('PostCreateInput'))).toMatchInlineSnapshot(`
                                                      "input PostCreateInput {
                                                        title: String
                                                        pinnedComment: CommentCreateOneNestedInput
                                                        comments: CommentCreateManyNestedInput
                                                      }"
                                    `);
  });

  test('CommentCreateOneNestedInput', () => {
    expect(printType(schema.getType('CommentCreateOneNestedInput')))
      .toMatchInlineSnapshot(`
                                                "input CommentCreateOneNestedInput {
                                                  create: CommentCreateInput
                                                }"
                                `);
  });

  test('CommentCreateManyNestedInput', () => {
    expect(printType(schema.getType('CommentCreateManyNestedInput')))
      .toMatchInlineSnapshot(`
                                                "input CommentCreateManyNestedInput {
                                                  create: [CommentCreateInput]
                                                }"
                                `);
  });

  test('CommentCreateInput', () => {
    expect(printType(schema.getType('CommentCreateInput')))
      .toMatchInlineSnapshot(`
                                    "input CommentCreateInput {
                                      message: String
                                      user: UserCreateOneRelationInput
                                    }"
                        `);
  });

  test('UserCreateOneRelationInput', () => {
    expect(printType(schema.getType('UserCreateOneRelationInput')))
      .toMatchInlineSnapshot(`
                              "input UserCreateOneRelationInput {
                                create: UserCreateInput
                                connect: UserWhereUniqueInput
                              }"
                    `);
  });

  test('UserCreateInput', () => {
    expect(printType(schema.getType('UserCreateInput'))).toMatchInlineSnapshot(`
                        "input UserCreateInput {
                          username: String
                        }"
                `);
  });

  test('UserWhereUniqueInput', () => {
    expect(printType(schema.getType('UserWhereUniqueInput')))
      .toMatchInlineSnapshot(`
                  "input UserWhereUniqueInput {
                    id: ID
                  }"
            `);
  });
});

describe('interface', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      owner: User @relation
    }

    interface User @model @inherit {
      id: ID @id @unique @db(name: "_id")
    }

    type Admin implements User {
      username: String
    }

    type Subscriber implements User {
      profile: SubscriberProfile
    }

    type SubscriberProfile @embedded {
      name: String
    }
  `);

  test('UserCreateOneRelationInput', () => {
    expect(printType(schema.getType('UserCreateOneRelationInput')))
      .toMatchInlineSnapshot(`
            "input UserCreateOneRelationInput {
              create: UserInterfaceCreateInput
              connect: UserWhereUniqueInput
            }"
        `);
  });

  test('UserInterfaceCreateInput', () => {
    expect(printType(schema.getType('UserInterfaceCreateInput')))
      .toMatchInlineSnapshot(`
      "input UserInterfaceCreateInput {
        Admin: AdminCreateInput
        Subscriber: SubscriberCreateInput
      }"
    `);
  });
});
