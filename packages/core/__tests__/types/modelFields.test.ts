import { printType } from 'graphql';
import gql from 'graphql-tag';
import { generateSchema } from './generateSchema';

describe('modelFields', () => {
  test('full schema', () => {
    const schema = generateSchema(gql`
      type Post @model {
        id: ID @id @unique
        title: String
      }
    `);

    const queryStr = printType(schema.getQueryType());
    const mutationStr = printType(schema.getMutationType());

    //TODO: add pagination
    //postsPaged(where: PostWhereInput, orderBy: PostOrderByInput, skip: Int, first: Int): PostPagination!

    expect(queryStr).toMatchInlineSnapshot(`
      "type Query {
        posts(where: PostWhereInput, orderBy: PostOrderByInput, offset: Int, first: Int): [Post!]!
        post(where: PostWhereUniqueInput): Post
        postsConnection(where: PostWhereInput, orderBy: PostOrderByInput, offset: Int, first: Int): PostConnection
      }"
    `);

    expect(mutationStr).toMatchInlineSnapshot(`
            "type Mutation {
              createPost(data: PostCreateInput!): Post
              deletePost(where: PostWhereUniqueInput!): Post
              deletePosts(where: PostWhereInput!): Int!
              updatePost(data: PostUpdateInput!, where: PostWhereUniqueInput!): Post
            }"
        `);

    expect(printType(schema.getType('PostConnection'))).toMatchInlineSnapshot(`
        "type PostConnection {
          nodes: [Post!]!
          totalCount: Int
          aggregate: AggregatePost
        }"
      `);

    expect(printType(schema.getType('AggregatePost'))).toMatchInlineSnapshot(`
      "type AggregatePost {
        count: Int!
      }"
    `);
  });
});
