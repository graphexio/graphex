import { printType } from 'graphql';
import gql from 'graphql-tag';
import { generateSchema } from './generateSchema';

describe('aclWhere', () => {
  const schema = generateSchema(
    gql`
      type Post @model {
        id: ID @id @unique @db(name: "_id")
        title: String
        pinnedComment: Comment
        comments: [Comment!]
      }

      type Comment {
        message: String
      }
    `,
    { aclWhere: true }
  );

  test('PostWhereUniqueInput', () => {
    expect(printType(schema.getType('PostWhereUniqueInput')))
      .toMatchInlineSnapshot(`
        "input PostWhereUniqueInput {
          aclWhere: PostWhereACLInput
          id: ID
        }"
    `);
  });

  test('PostWhereInput', () => {
    expect(printType(schema.getType('PostWhereInput'))).toMatchInlineSnapshot(`
      "input PostWhereInput {
        aclWhere: PostWhereACLInput
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
        pinnedComment_exists: Boolean
        pinnedComment_in: [CommentWhereCleanInput]
        pinnedComment_not_in: [CommentWhereCleanInput]
        pinnedComment: CommentWhereInput
        comments_size: Int
        comments_not_size: Int
        comments_exists: Boolean
        comments_all: [CommentWhereCleanInput]
        comments_exact: [CommentWhereCleanInput]
        comments_in: [CommentWhereCleanInput]
        comments_not_in: [CommentWhereCleanInput]
        comments_some: CommentWhereInput
      }"
    `);
  });
});
