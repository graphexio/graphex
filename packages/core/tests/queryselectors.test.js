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

const schema = generateSchema(gql`
  type Post @model {
    id: ID @id @unique
    title: String
    pinnedComment: Comment
    comments: [Comment]!
    tags: [String]!
    num: Int
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

describe('array selectors', () => {
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
});

describe('nested selectors', () => {
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

  test('asis nested', async () => {
    let selector = await applyInputTransform({})(
      {
        pinnedComment: { user: { id: 'USERID' } },
      },
      schema.getTypeMap().PostWhereInput
    );

    expect(selector).toEqual({
      'pinnedComment.user.id': 'USERID',
    });
  });
});

describe('scalar selectors', () => {
  test('in', async () => {
    let selector = await applyInputTransform({})(
      {
        title_in: ['title1', 'title2'],
      },
      schema.getTypeMap().PostWhereInput
    );

    expect(selector).toEqual({
      title: { $in: ['title1', 'title2'] },
    });
  });

  test('exists', async () => {
    let selector = await applyInputTransform({})(
      {
        title_exists: true,
      },
      schema.getTypeMap().PostWhereInput
    );

    expect(selector).toEqual({ title: { $exists: true } });
  });

  test('lt', async () => {
    let selector = await applyInputTransform({})(
      {
        num_lt: 10,
      },
      schema.getTypeMap().PostWhereInput
    );

    expect(selector).toEqual({ num: { $lt: 10 } });
  });

  test('lte', async () => {
    let selector = await applyInputTransform({})(
      {
        num_lte: 10,
      },
      schema.getTypeMap().PostWhereInput
    );

    expect(selector).toEqual({ num: { $lte: 10 } });
  });

  test('gt', async () => {
    let selector = await applyInputTransform({})(
      {
        num_gt: 10,
      },
      schema.getTypeMap().PostWhereInput
    );

    expect(selector).toEqual({ num: { $gt: 10 } });
  });

  test('gte', async () => {
    let selector = await applyInputTransform({})(
      {
        num_gte: 10,
      },
      schema.getTypeMap().PostWhereInput
    );

    expect(selector).toEqual({ num: { $gte: 10 } });
  });

  test('not', async () => {
    let selector = await applyInputTransform({})(
      {
        num_not: 10,
      },
      schema.getTypeMap().PostWhereInput
    );

    expect(selector).toEqual({ num: { $not: { $eq: 10 } } });
  });
});
