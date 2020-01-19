import { GraphQLObjectType } from 'graphql';
import AMM from '@apollo-model/core';
import gql from 'graphql-tag';

import { modelField } from '../src';

const schema = new AMM({}).makeExecutableSchema({
  typeDefs: gql`
    type Brand @model {
      id: ID @id
      title: String
    }
  `,
});

test('fieldAccessRule', () => {
  const modelName = 'Brand';
  const fieldName = 'title';
  const type = schema.getType('Brand') as GraphQLObjectType;
  const field = type.getFields()['title'];

  const rule = modelField(modelName, fieldName, 'R');

  expect(rule({ type, field, schema })).toBe(true);
});

test('fieldAccessRule Wildcard', () => {
  const modelName = 'Brand';
  const fieldName = 'title';
  const type = schema.getType('Brand') as GraphQLObjectType;
  const field = type.getFields()['title'];

  const Query = schema.getType('Query');
  const Mutation = schema.getType('Mutation');
  //   const Subscription = schema.getType('Subscription');

  let rule = modelField('.*', '.*', 'R');

  expect(rule({ type, field, schema })).toBe(true);
  expect(rule({ type: Query, field, schema })).toBe(false);
  expect(rule({ type: Mutation, field, schema })).toBe(false);
  //   expect(rule({ type: Subscription, field, schema })).toBe(false);
});
