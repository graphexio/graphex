import * as DirectiveImplements from '@apollo-model/directive-implements';
import gql from 'graphql-tag';
import AMM from '../src/';
import { applyInputTransform } from '../src/inputTypes/utils';
import { AMTransaction } from '../src/execution/transaction';
import { AMVisitor } from '../src/execution/visitor';

const generateSchema = typeDefs => {
  return new AMM({
    modules: [DirectiveImplements],
  }).makeExecutableSchema({
    resolverValidationOptions: {
      requireResolversForResolveType: false,
    },
    typeDefs: [typeDefs],
  });
};

const getSelectorFactory = schema => (rq, variables = {}) => {
  const transaction = new AMTransaction();
  AMVisitor.visit(schema, rq, variables, transaction);
  return transaction.operations[0].selector.selector;
};

describe('simple schema', () => {
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

  const getSelector = getSelectorFactory(schema);

  describe('array selectors', () => {
    test('size', () => {
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

    test('not_size', () => {
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

    test('exists', () => {
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

    test('all for scalar 1', () => {
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

    test('all for scalar 2', () => {
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

    test('all for embedded', () => {
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

    test('exact', () => {
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

    test('in', () => {
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

    test('not_in', () => {
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

    test('some', () => {
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
    test('some nested', () => {
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

    test('asis nested', () => {
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
    test('asis', () => {
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

    test('in', () => {
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

    test('exists', () => {
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

    test('lt', () => {
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

    test('lte', () => {
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

    test('gt', () => {
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

    test('gte', () => {
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

    test('not', () => {
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

    test('contains', () => {
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

    test('starts_with', () => {
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

    test('ends_with', () => {
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

  describe('variables', () => {
    test('string', () => {
      let selector = getSelector(
        gql`
          query GetPosts($title: String) {
            posts(where: { title: $title }) {
              id
            }
          }
        `,
        { title: 'search-title' }
      );

      expect(selector).toEqual({ title: 'search-title' });
    });

    test('object', () => {
      let selector = getSelector(
        gql`
          query GetPosts($where: PostWhereInput) {
            posts(where: $where) {
              id
            }
          }
        `,
        { where: { title: 'search-title' } }
      );

      expect(selector).toEqual({ title: 'search-title' });
    });
  });
});

describe('relations', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique
      title: String
      pinnedComment: Comment @relation
      comments: [Comment]! @relation
      tags: [String]!
      num: Int
    }

    type Comment @model {
      id: ID @id @unique
      message: String
      user: User @relation
      likes: [User] @relation
    }

    type User @model {
      id: ID @id @unique
      username: String
    }
  `);

  const getSelector = getSelectorFactory(schema);

  test('some', () => {
    let selector = getSelector(
      gql`
        {
          posts(where: { comments_some: { message: "test message" } }) {
            id
          }
        }
      `
    );

    expect(selector).toMatchInlineSnapshot(`
      Object {
        "commentIds": Object {
          "$in": "AMResultPromise { Operation-1 -> distinct('_id') }",
        },
      }
    `);
  });

  describe('enum', () => {
    const schema = generateSchema(gql`
      enum Role {
        admin
        customer
      }

      type User @model {
        id: ID @id @unique
        username: String
        role: Role
      }
    `);

    const getSelector = getSelectorFactory(schema);

    test('in', () => {
      let selector = getSelector(
        gql`
          {
            users(where: { role_in: [admin] }) {
              id
            }
          }
        `
      );

      expect(selector).toMatchInlineSnapshot(`
        Object {
          "role": Object {
            "$in": Array [
              "admin",
            ],
          },
        }
      `);
    });
  });
});
