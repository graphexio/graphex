import { prepareIntrospection } from './utils';
import { IntrospectionResult } from '../src/introspectionResult';
import gql from 'graphql-tag';

let introspection: IntrospectionResult;
beforeAll(async () => {
  introspection = await prepareIntrospection(gql`
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

    type Post @model {
      id: ID! @id @unique
      title: String
      owner: Visitor! @relation
      likes: [Visitor!]! @relation
      moderator: User! @relation
      approves: [User!]! @relation
      keywords: [String!]!
    }

    type Meta {
      tags: [String!]!
      slug: String
    }
  `);
});

test('getUpdateType', () => {
  // const resource = {};
  expect(introspection.getUpdateType('Admin', 'data').name).toMatch(
    'AdminUpdateInput'
  );
  expect(introspection.getUpdateType('User', 'where').name).toMatch(
    'UserInterfaceWhereUniqueInput'
  );
});

test('getOneWhereType', () => {
  expect(introspection.getGetOneWhereType('User').name).toMatch(
    'UserInterfaceWhereUniqueInput'
  );
});

test('getManyWhereType', () => {
  expect(introspection.getGetManyWhereType('User').name).toMatch(
    'UserInterfaceWhereInput'
  );
});
