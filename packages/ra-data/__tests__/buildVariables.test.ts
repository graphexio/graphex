import {
  GET_LIST,
  GET_MANY,
  GET_MANY_REFERENCE,
  GET_ONE,
  CREATE,
  UPDATE,
  DELETE,
} from 'react-admin';
import buildVariables from '../src/buildVariables';
import { TypeKind } from 'graphql/type/introspection';
import { IntrospectionResultData, Resource } from '../src/definitions';

import { prepareIntrospection } from './utils';
import gql from 'graphql-tag';
import { IntrospectionResult } from '../src/introspectionResult';

let introspection: IntrospectionResult;
beforeAll(async () => {
  introspection = await prepareIntrospection(gql`
    enum Position {
      leftColumn
      rightColumn
    }

    interface User @model @inherit {
      id: ID! @id @unique
      username: String
    }
    type Admin implements User {
      nick: String
    }
    type Visitor implements User {
      session: String
    }

    type Group @model {
      id: ID! @id @unique
      title: String
    }

    type Post @model {
      id: ID! @id @unique
      title: String
      owner: Visitor! @relation
      likes: [Visitor!]! @relation
      moderator: User! @relation
      approves: [User!]! @relation
      keywords: [String!]!
      meta: Meta
      metas: [Meta!]!
      position: Position
      point: GeoJSONPoint
      polygon: GeoJSONPolygon
    }

    type Meta @embedded {
      tags: [String!]!
      slug: String
      group: Group @relation
    }
  `);
});

describe('buildVariables', () => {
  describe('GET_LIST', () => {
    it('returns correct variables', () => {
      const IntrospectionResultData = {
        types: [
          {
            kind: 'INPUT_OBJECT',
            name: 'PostWhereInput',
            inputFields: [{ name: 'tags_some', type: { kind: '', name: '' } }],
          },
        ],
      };
      const params = {
        filter: {
          ids: ['foo1', 'foo2'],
          tags: { id: ['tag1', 'tag2'] },
          'author.id': 'author1',
          views: 100,
        },
        pagination: { page: 10, perPage: 10 },
        sort: { field: 'sortField', order: 'DESC' },
      };

      expect(
        buildVariables(IntrospectionResultData as IntrospectionResultData)(
          { type: { name: 'Post' } } as Resource,
          GET_LIST,
          params
        )
      ).toEqual({
        where: {
          id_in: ['foo1', 'foo2'],
          tags_some: { id_in: ['tag1', 'tag2'] },
          author: { id: 'author1' },
          views: 100,
        },
        first: 10,
        orderBy: 'sortField_DESC',
        skip: 90,
      });
    });
  });

  describe('GET_ONE', () => {
    const params = {
      id: 'foo',
      __typename: 'Admin',
    };
    it('returns correct variables (interface)', () => {
      expect(
        buildVariables(introspection.data, introspection)(
          { type: { name: 'User' } } as Resource,
          GET_ONE,
          params
        )
      ).toEqual({
        where: {
          Admin: {
            id: 'foo',
          },
        },
      });
    });

    it('returns correct variables (type)', () => {
      expect(
        buildVariables(introspection.data, introspection)(
          { type: { name: 'Admin' } } as Resource,
          GET_ONE,
          params
        )
      ).toEqual({
        where: { id: 'foo' },
      });
    });
  });

  describe('CREATE', () => {
    it('returns correct variables', () => {
      const params = {
        data: {
          id: 'postId',
          title: 'new title',
          keywords: ['keyword'],
          owner: { id: 'owner-id', customField: 'customFieldValue' },
          moderator: { id: 'moderator-id' },
          likes: [{ id: 'user-1' }, { id: 'user-2' }],
          approves: [{ id: 'moderator-id' }],
          meta: { slug: 'slug-1', group: { id: 'group-id' } },
          metas: [
            { slug: 'slug-1', group: { id: 'group-id' } },
            { slug: 'slug-2' },
          ],
          position: 'leftColumn',
          point: {
            type: 'Point',
            coordinates: [[0, 0]],
          },
          polygon: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [1, 1],
                [0, 0],
                [0, 0],
              ],
            ],
          },
        },
        previousData: {
          id: 'postId',
        },
      };
      expect(
        buildVariables(introspection.data, introspection)(
          { type: { name: 'Post' } } as Resource,
          CREATE,
          params
        )
      ).toEqual({
        data: {
          title: 'new title',
          keywords: ['keyword'],
          owner: {
            connect: {
              id: 'owner-id',
            },
          },
          likes: {
            connect: [
              {
                id: 'user-1',
              },
              {
                id: 'user-2',
              },
            ],
          },
          moderator: {
            connect: {
              User: {
                id: 'moderator-id',
              },
            },
          },
          approves: {
            connect: [
              {
                User: {
                  id: 'moderator-id',
                },
              },
            ],
          },
          meta: {
            create: { slug: 'slug-1', group: { connect: { id: 'group-id' } } },
          },
          metas: {
            create: [
              { slug: 'slug-1', group: { connect: { id: 'group-id' } } },
              { slug: 'slug-2' },
            ],
          },
          position: 'leftColumn',
          point: {
            type: 'Point',
            coordinates: [[0, 0]],
          },
          polygon: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [1, 1],
                [0, 0],
                [0, 0],
              ],
            ],
          },
        },
      });
    });

    it('create interface', () => {
      const params = {
        data: {
          __typename: 'Admin',
          username: 'admin',
        },
        previousData: {},
      };
      expect(
        buildVariables(introspection.data, introspection)(
          { type: { name: 'User' } } as Resource,
          CREATE,
          params
        )
      ).toEqual({
        data: {
          Admin: {
            username: 'admin',
          },
        },
      });
    });
  });

  describe('UPDATE', () => {
    it('returns correct variables', () => {
      const params = {
        data: {
          id: 'postId',
          title: 'new title',
          keywords: ['keyword'],
          owner: { id: 'owner-id' },
          moderator: { id: 'moderator-id' },
          likes: [{ id: 'user-1' }, { id: 'user-2' }],
          approves: [{ id: 'moderator-id' }],
          meta: { slug: 'slug-1', group: { id: 'group-id' } },
          metas: [
            { slug: 'slug-1', group: { id: 'group-id' } },
            { slug: 'slug-2' },
          ],
          position: 'leftColumn',
        },
        previousData: {
          id: 'postId',
        },
      };
      expect(
        buildVariables(introspection.data, introspection)(
          { type: { name: 'Post' } } as Resource,
          UPDATE,
          params
        )
      ).toEqual({
        where: { id: 'postId' },
        data: {
          title: 'new title',
          keywords: ['keyword'],
          owner: {
            connect: {
              id: 'owner-id',
            },
          },
          likes: {
            reconnect: [
              {
                id: 'user-1',
              },
              {
                id: 'user-2',
              },
            ],
          },
          moderator: {
            connect: {
              User: {
                id: 'moderator-id',
              },
            },
          },
          approves: {
            reconnect: [
              {
                User: {
                  id: 'moderator-id',
                },
              },
            ],
          },
          meta: {
            create: { slug: 'slug-1', group: { connect: { id: 'group-id' } } },
          },
          metas: {
            recreate: [
              { slug: 'slug-1', group: { connect: { id: 'group-id' } } },
              { slug: 'slug-2' },
            ],
          },
          position: 'leftColumn',
        },
      });
    });

    it('returns correct variables', () => {
      const params = {
        data: {
          id: 'postId',
          metas: null,
        },
        previousData: {
          id: 'postId',
        },
      };
      expect(
        buildVariables(introspection.data, introspection)(
          { type: { name: 'Post' } } as Resource,
          UPDATE,
          params
        )
      ).toEqual({
        data: {
          metas: null,
        },
        where: {
          id: 'postId',
        },
      });
    });

    it('returns correct variables (interface)', () => {
      const params = {
        data: {
          __typename: 'Admin',
          id: 'userId',
          username: 'Bar',
        },
        previousData: {
          id: 'userId',
          username: 'Foo',
        },
      };
      expect(
        buildVariables(introspection.data, introspection)(
          { type: { name: 'User' } } as Resource,
          UPDATE,
          params
        )
      ).toEqual({
        data: {
          username: 'Bar',
        },
        where: {
          Admin: {
            id: 'userId',
          },
        },
      });
    });
  });

  describe('GET_MANY', () => {
    it('returns correct variables', () => {
      const params = {
        ids: ['tag1', 'tag2'],
      };

      expect(
        buildVariables({} as IntrospectionResultData)(
          { type: { name: 'Post' } } as Resource,
          GET_MANY,
          params
        )
      ).toEqual({
        where: { id_in: ['tag1', 'tag2'] },
      });
    });

    it('returns correct variables (interface)', () => {
      const params = {
        ids: ['tag1', 'tag2'],
        __typename: 'User',
      };

      expect(
        buildVariables(introspection.data, introspection)(
          { type: { name: 'User' } } as Resource,
          'GET_MANY',
          params
        )
      ).toEqual({
        where: { User: { id_in: ['tag1', 'tag2'] } },
      });
    });
  });

  describe('GET_MANY_REFERENCE', () => {
    it('returns correct variables', () => {
      const params = {
        target: 'author.id',
        id: 'author1',
      };

      expect(
        buildVariables({} as IntrospectionResultData)(
          { type: { name: 'Post' } } as Resource,
          GET_MANY_REFERENCE,
          params
        )
      ).toEqual({
        where: { author: { id: 'author1' } },
      });
    });

    it('returns correct variables (interface)', () => {
      const params = {
        target: 'author.id',
        id: 'author1',
      };

      expect(
        buildVariables(introspection.data, introspection)(
          { type: { name: 'User' } } as Resource,
          GET_MANY_REFERENCE,
          params
        )
      ).toEqual({
        where: { author: { id: 'author1' } },
      });
    });

  });

  describe('DELETE', () => {
    it('returns correct variables', () => {
      const params = {
        id: 'post1',
      };

      expect(
        buildVariables({} as IntrospectionResultData)(
          { type: { name: 'Post', inputFields: [] } } as any,
          DELETE,
          params
        )
      ).toEqual({
        where: { id: 'post1' },
      });
    });

    it('returns correct variables (interface)', () => {
      const params = { id: 'userId' };

      expect(
        buildVariables(introspection.data, introspection)(
          { type: { name: 'User' } } as Resource,
          DELETE,
          params
        )
      ).toEqual({
        where: {
          User: {
            id: 'userId',
          },
        },
      });
    });
  });
});
