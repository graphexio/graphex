import gql from 'graphql-tag';
import AMM from '@graphex/core';
import { matchingTypes, extractAbstractTypes } from '../src/utils';

const schema = new AMM({}).makeExecutableSchema({
  typeDefs: gql`
    interface Node {
      id: ID @id
    }

    type Post implements Node @model {
      id: ID @id
      title: String
    }

    type Comment implements Node @model {
      id: ID @id
      message: String
    }
  `,
});

test('Exact', () => {
  expect(matchingTypes(schema, new RegExp('^(?:Post|Comment)$')))
    .toMatchInlineSnapshot(`
    Array [
      "Post",
      "Comment",
    ]
  `);
});

test('Interface', () => {
  expect(
    extractAbstractTypes(schema, matchingTypes(schema, new RegExp('^Node$')))
  ).toMatchInlineSnapshot(`
Array [
  "Node",
  "Post",
  "Comment",
]
`);
});
