import * as DirectiveImplements from '@apollo-model/directive-implements';
import gql from 'graphql-tag';
import AMM from '../src';
import { applyInputTransform } from '../src/inputTypes/utils';
import { AMTransaction } from '../src/execution/transaction';
import { AMVisitor } from '../src/execution/visitor';

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

const getSelector = rq => {
  const transaction = new AMTransaction();
  AMVisitor.visit(schema, rq, transaction);
  return transaction.operations[0].selector.selector;
};

describe('array selectors', () => {
  test('size', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { comments_size: 1 }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({ comments: { $size: 1 } });
  });

  test('not_size', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { comments_not_size: 1 }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({ comments: { $not: { $size: 1 } } });
  });

  test('exists', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { comments_exists: true }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({ comments: { $exists: true } });
  });

  test('all for scalar 1', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { tags_all: ["apollo-model"] }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({
      tags: { $all: ['apollo-model'] },
    });
  });

  test('all for scalar 2', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { tags_all: "apollo-model" }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({
      tags: { $all: ['apollo-model'] },
    });
  });

  test('all for embedded', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { comments_all: { message: "test message" } }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({
      comments: { $all: [{ message: 'test message' }] },
    });
  });

  test('exact', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { comments_exact: { message: "test message" } }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({
      comments: { $eq: [{ message: 'test message' }] },
    });
  });

  test('in', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { comments_in: { message: "test message" } }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({
      comments: { $in: [{ message: 'test message' }] },
    });
  });

  test('not_in', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { comments_not_in: { message: "test message" } }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({
      comments: { $not: { $in: [{ message: 'test message' }] } },
    });
  });

  test('some', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { comments_some: { message: "test message" } }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({
      comments: { $elemMatch: { message: 'test message' } },
    });
  });
});

describe('nested selectors', () => {
  test('some nested', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { comments_some: { likes_some: { id: "USERID" } } }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({
      comments: { $elemMatch: { likes: { $elemMatch: { id: 'USERID' } } } },
    });
  });

  test('asis nested', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { pinnedComment: { user: { id: "USERID" } } }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({
      'pinnedComment.user.id': 'USERID',
    });
  });
});

describe('scalar selectors', () => {
  test('asis', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { title: "test-title" }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({ title: 'test-title' });
  });

  test('in', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { title_in: ["title1", "title2"] }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({
      title: { $in: ['title1', 'title2'] },
    });
  });

  test('exists', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { title_exists: true }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({ title: { $exists: true } });
  });

  test('lt', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { num_lt: 10 }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({ num: { $lt: 10 } });
  });

  test('lte', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { num_lte: 10 }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({ num: { $lte: 10 } });
  });

  test('gt', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { num_gt: 10 }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({ num: { $gt: 10 } });
  });

  test('gte', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { num_gte: 10 }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({ num: { $gte: 10 } });
  });

  test('not', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { num_not: 10 }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({ num: { $not: { $eq: 10 } } });
  });

  test('contains', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { title_contains: "title" }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({ title: { $regex: /title/ } });
  });

  test('starts_with', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { title_starts_with: "title" }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({ title: { $regex: /^title/ } });
  });

  test('ends_with', async () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { title_ends_with: "title" }) {
            id
          }
        }
      `
    );

    expect(selector).toEqual({ title: { $regex: /title$/ } });
  });
});
