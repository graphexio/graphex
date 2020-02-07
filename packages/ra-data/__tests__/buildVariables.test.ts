import {
  GET_LIST,
  GET_MANY,
  GET_MANY_REFERENCE,
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

  describe('CREATE', () => {
    // it('returns correct variables', () => {
    //   const IntrospectionResultData = {
    //     types: [
    //       {
    //         name: 'Post',
    //         fields: [
    //           {
    //             name: 'title',
    //           },
    //         ],
    //       },
    //       {
    //         name: 'PostCreateInput',
    //         kind: TypeKind.INPUT_OBJECT,
    //         inputFields: [
    //           {
    //             name: 'author',
    //             type: {
    //               kind: TypeKind.NON_NULL,
    //               ofType: {
    //                 kind: TypeKind.INPUT_OBJECT,
    //                 name: 'AuthorCreateOneInput',
    //               },
    //             },
    //           },
    //           {
    //             name: 'tags',
    //             type: {
    //               kind: TypeKind.NON_NULL,
    //               ofType: {
    //                 kind: TypeKind.INPUT_OBJECT,
    //                 name: 'TagCreateManyInput',
    //               },
    //             },
    //           },
    //         ],
    //       },
    //       {
    //         name: 'AuthorCreateOneInput',
    //         kind: TypeKind.INPUT_OBJECT,
    //         inputFields: [
    //           {
    //             name: 'connect',
    //             type: {
    //               kind: TypeKind.NON_NULL,
    //               ofType: {
    //                 kind: TypeKind.INPUT_OBJECT,
    //                 name: 'AuthorWhereUniqueInput',
    //               },
    //             },
    //           },
    //         ],
    //       },
    //       {
    //         name: 'AuthorWhereUniqueInput',
    //         kind: TypeKind.INPUT_OBJECT,
    //         inputFields: [
    //           {
    //             name: 'id',
    //             type: {
    //               kind: TypeKind.SCALAR,
    //               name: 'String',
    //             },
    //           },
    //         ],
    //       },
    //       {
    //         name: 'TagCreateManyInput',
    //         kind: TypeKind.INPUT_OBJECT,
    //         inputFields: [
    //           {
    //             name: 'connect',
    //             type: {
    //               kind: TypeKind.NON_NULL,
    //               ofType: {
    //                 kind: TypeKind.INPUT_OBJECT,
    //                 name: 'TagWhereUniqueInput',
    //               },
    //             },
    //           },
    //         ],
    //       },
    //       {
    //         name: 'TagWhereUniqueInput',
    //         kind: TypeKind.INPUT_OBJECT,
    //         inputFields: [
    //           {
    //             name: 'id',
    //             type: {
    //               kind: TypeKind.SCALAR,
    //               name: 'String',
    //             },
    //           },
    //         ],
    //       },
    //     ],
    //   };
    //   const params = {
    //     data: {
    //       author: { id: 'author1' },
    //       title: 'Foo',
    //       tags: [{ id: 'tags1' }, { id: 'tags2' }],
    //       tagsIds: ['tags1', 'tags2'],
    //     },
    //   };
    //   expect(
    //     buildVariables(IntrospectionResultData as IntrospectionResultData)(
    //       { type: { name: 'Post' } } as Resource,
    //       CREATE,
    //       params
    //     )
    //   ).toEqual({
    //     data: {
    //       author: { connect: { id: 'author1' } },
    //       tags: {
    //         connect: [{ id: 'tags1' }, { id: 'tags2' }],
    //       },
    //       title: 'Foo',
    //     },
    //   });
    // });
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
  });
});
