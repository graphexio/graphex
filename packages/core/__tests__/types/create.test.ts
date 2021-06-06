import { printType } from 'graphql';
import gql from 'graphql-tag';
import { generateSchema } from './generateSchema';

describe('create', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      pinnedComment: Comment @subdocument
      comments: [Comment!] @subdocument
      status: String @readonly
    }

    type Comment {
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
