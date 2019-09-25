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

  test('all for embedded', async () => {
    let selector = await applyInputTransform({})(
      {
        comments_all: { message: 'test message' },
      },
      schema.getTypeMap().PostWhereInput
    );

    expect(selector).toEqual({
      comments: { $all: [{ message: 'test message' }] },
    });
  });

  test('exact', async () => {
    let selector = await applyInputTransform({})(
      {
        comments_exact: { message: 'test message' },
      },
      schema.getTypeMap().PostWhereInput
    );

    expect(selector).toEqual({
      comments: { $eq: [{ message: 'test message' }] },
    });
  });

  test('in', async () => {
    let selector = await applyInputTransform({})(
      {
        comments_in: { message: 'test message' },
      },
      schema.getTypeMap().PostWhereInput
    );

    expect(selector).toEqual({
      comments: { $in: [{ message: 'test message' }] },
    });
  });

  test('not_in', async () => {
    let selector = await applyInputTransform({})(
      {
        comments_not_in: { message: 'test message' },
      },
      schema.getTypeMap().PostWhereInput
    );

    expect(selector).toEqual({
      comments: { $not: { $in: [{ message: 'test message' }] } },
    });
  });

  test('some', async () => {
    let selector = await applyInputTransform({})(
      {
        comments_some: { message: 'test message' },
      },
      schema.getTypeMap().PostWhereInput
    );

    expect(selector).toEqual({
      comments: { $elemMatch: { message: 'test message' } },
    });
  });

  test('some nested', async () => {
    let selector = await applyInputTransform({})(
      {
        comments_some: { likes_some: { id: 'USERID' } },
      },
      schema.getTypeMap().PostWhereInput
    );

    expect(selector).toEqual({
      comments: { $elemMatch: { likes: { $elemMatch: { id: 'USERID' } } } },
    });
  });
});
