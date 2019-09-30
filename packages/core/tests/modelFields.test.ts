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

test('full schema', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique
      title: String
    }
  `);

  const queryStr = printType(schema.getQueryType());
  const mutationStr = printType(schema.getMutationType());

  expect(queryStr).toMatchInlineSnapshot(`
        "type Query {
          posts(where: PostWhereInput, orderBy: PostOrderByInput, skip: Int, first: Int): [Post!]!
          postsPaged(where: PostWhereInput, orderBy: PostOrderByInput, skip: Int, first: Int): PostPagination!
          post(where: PostWhereUniqueInput): Post
          postsConnection(where: PostWhereInput, orderBy: PostOrderByInput, skip: Int, first: Int): PostConnection
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
});
