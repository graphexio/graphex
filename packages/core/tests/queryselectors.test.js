import { ApolloServer } from 'apollo-server';
import AMM from '../src/';
import QueryExecutor from '@apollo-model/mongodb-executor';
import gql from 'graphql-tag';
import * as DirectiveImplements from '@apollo-model/directive-implements';
import { applyInputTransform } from '../src/inputTypes/utils';

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

describe('array selectors', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique
      title: String
      pinnedComment: Comment
      comments: [Comment]!
      tags: [String]!
    }

    type Comment @embedded {
      message: String
      user: User
      likes: [User]
    }

    type User @embedded {
      id: ID
      username: String
    }
  `);

  test('size', async () => {
    let selector = await applyInputTransform({})(
      {
        comments_size: 1,
      },
      schema.getTypeMap().PostWhereInput
    );

    expect(selector).toEqual({ comments: { $size: 1 } });
  });

  test('not_size', async () => {
    let selector = await applyInputTransform({})(
      {
        comments_not_size: 1,
      },
      schema.getTypeMap().PostWhereInput
    );

    expect(selector).toEqual({ comments: { $not: { $size: 1 } } });
  });

  test('exists', async () => {
    let selector = await applyInputTransform({})(
      {
        comments_exists: true,
      },
      schema.getTypeMap().PostWhereInput
    );

    expect(selector).toEqual({ comments: { $exists: true } });
  });

  test('all for scalar 1', async () => {
    let selector = await applyInputTransform({})(
      {
        tags_all: ['apollo-model'],
      },
      schema.getTypeMap().PostWhereInput
    );

    expect(selector).toEqual({
      tags: { $all: ['apollo-model'] },
    });
  });

  test('all for scalar 2', async () => {
    let selector = await applyInputTransform({})(
      {
        tags_all: 'apollo-model',
      },
      schema.getTypeMap().PostWhereInput
    );

    expect(selector).toEqual({
      tags: { $all: ['apollo-model'] },
    });
  });
});
