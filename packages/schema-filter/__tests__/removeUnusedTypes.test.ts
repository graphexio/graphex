import { makeExecutableSchema } from 'apollo-server';
import gql from 'graphql-tag';
import { print, printSchema, execute } from 'graphql';

import { removeUnusedTypes } from '../src/removeUnusedTypes';

test('removeUnusedTypes', () => {
  const schema = makeExecutableSchema({
    typeDefs: gql`
      type Query {
        test: TestInterface
      }

      interface TestInterface {
        field: String
      }

      type Test implements TestInterface {
        field: String
        nestedObject: NestedType
      }

      type NestedType {
        field: String
      }

      type UnusedType {
        field: UnusedNestedType
      }

      type UnusedNestedType {
        field: String
      }

      type Mutation {
        add(value: AddInput): TestInterface
      }

      input AddInput {
        field: String
        nestedInput: NestedAddInput
      }

      input NestedAddInput {
        field: String
      }
    `,
    resolvers: {
      Query: {
        test: () => ({ __typename: 'Test', field: 'test value' }),
      },
    },
    resolverValidationOptions: { requireResolversForResolveType: false },
  });

  const cleanSchema = makeExecutableSchema({
    typeDefs: gql`
      type Query {
        test: TestInterface
      }

      interface TestInterface {
        field: String
      }

      type Test implements TestInterface {
        field: String
        nestedObject: NestedType
      }

      type NestedType {
        field: String
      }

      type Mutation {
        add(value: AddInput): TestInterface
      }

      input AddInput {
        field: String
        nestedInput: NestedAddInput
      }

      input NestedAddInput {
        field: String
      }
    `,
    resolverValidationOptions: { requireResolversForResolveType: false },
  });

  const cleanedSchema = removeUnusedTypes(schema);
  expect(printSchema(cleanedSchema)).toEqual(printSchema(cleanSchema));

  expect(
    execute(
      cleanedSchema,
      gql`
        {
          test {
            field
          }
        }
      `
    )
  ).toEqual({ data: { test: { field: 'test value' } } });
});
