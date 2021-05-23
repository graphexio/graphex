import { printType } from 'graphql';
import gql from 'graphql-tag';
import { generateSchema } from './generateSchema';

describe('update', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      pinnedComment: Comment
      comments: [Comment!]
      status: String @readonly
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

  test('PostUpdateInput', () => {
    expect(printType(schema.getType('PostUpdateInput'))).toMatchInlineSnapshot(`
                  "input PostUpdateInput {
                    title: String
                    pinnedComment: CommentUpdateOneNestedInput
                    comments: CommentUpdateManyNestedInput
                  }"
            `);
  });

  test('CommentUpdateOneNestedInput', () => {
    expect(printType(schema.getType('CommentUpdateOneNestedInput')))
      .toMatchInlineSnapshot(`
                  "input CommentUpdateOneNestedInput {
                    create: CommentCreateInput
                    update: CommentUpdateInput
                  }"
            `);
  });

  test('CommentUpdateManyNestedInput', () => {
    expect(printType(schema.getType('CommentUpdateManyNestedInput')))
      .toMatchInlineSnapshot(`
                  "input CommentUpdateManyNestedInput {
                    create: [CommentCreateInput]
                    recreate: [CommentCreateInput]
                    updateMany: [CommentUpdateWithWhereNestedInput]
                    deleteMany: [CommentWhereInput]
                  }"
            `);
  });
});
