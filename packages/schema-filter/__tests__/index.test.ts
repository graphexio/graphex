import {
  makeExecutableSchema,
  transformSchema,
} from '@apollo-model/graphql-tools';
import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';
import { GraphQLEnumType, GraphQLObjectType } from 'graphql';
import gql from 'graphql-tag';
import { SchemaFilter } from '../src';
import { groupFields, mapFieldForTypeStack, reduceValues } from '../src/utils';

test('mapFieldForTypeStack', () => {
  const input = {
    type: 'type',
    args: [
      {
        name: 'arg1',
        type: 'arg1type',
      },
      {
        name: 'arg2',
        type: 'arg2type',
      },
    ],
  };

  const output = {
    type: input.type,
    args: {
      arg1: input.args[0],
      arg2: input.args[1],
    },
  };

  expect(mapFieldForTypeStack(input)).toEqual(output);
});

test('groupFields', () => {
  const isEven = n => n % 2 === 0;

  expect(groupFields(isEven, { a: 1, b: 2, c: 3, d: 4 })).toEqual({
    false: { a: 1, c: 3 },
    true: { b: 2, d: 4 },
  });
});

test('reduceValues', () => {
  expect(
    reduceValues([{ name: 1 }, { name: 2 }, { name: 3 }, { name: 4 }])
  ).toEqual({ 1: { name: 1 }, 3: { name: 3 }, 2: { name: 2 }, 4: { name: 4 } });
});

describe('SchemaFilter', () => {
  const filterFields = SchemaFilter({
    filterFields: (type, field) => {
      return !/^.*\.removeField$/.test(`${type.name}.${field.name}`);
    },
    defaultFields: (type, field) => {
      if (/.*\.(removeField)/.test(`${type.name}.${field.name}`)) {
        return () => 'Test';
      }
      if (/.*\.(defaultField)/.test(`${type.name}.${field.name}`)) {
        return () => 'DefaultValue';
      }
      if (/.*\.(defaultCreateField)/.test(`${type.name}.${field.name}`)) {
        return () => ({ create: { removeField: '123' } });
      }
    },
    defaultArgs: (type, field) => {
      if (type.name === 'Mutation' && field.name === 'updateMethod') {
        return () => ({
          data: {},
        });
      }
    },
  });

  const makeSchema = params => {
    const schema = makeExecutableSchema(params);
    return transformSchema(schema, [filterFields]);
  };

  const testClient = params => {
    const server = new ApolloServer(params);
    return createTestClient(server as any);
  };

  const FIELD_VALUE = 'fieldValue';
  const REMOVED_FIELD_VALUE = 'removedFieldValue';

  describe('GraphQLObject empty', () => {
    const typeDefs = gql`
      type Query {
        getMethod: Test
        otherMethod: String
      }

      type Test {
        removeField: String
      }
    `;

    const resolvers = {
      Query: {
        getMethod: () => ({
          field: FIELD_VALUE,
          removeField: REMOVED_FIELD_VALUE,
        }),
      },
    };

    test('schema', () => {
      const schema = makeSchema({ typeDefs, resolvers });
      expect(schema.getTypeMap().Test).toBeUndefined();
    });

    test('wrong request', async () => {
      const schema = makeSchema({ typeDefs, resolvers });
      const { query } = testClient({ schema });
      const { errors } = await query({
        query: gql`
          {
            getMethod {
              removeField
            }
          }
        `,
      });
      expect(errors[0].message).toEqual(
        'Cannot query field "getMethod" on type "Query". Did you mean "otherMethod"?'
      );
    });
  });

  describe('GraphQLObject', () => {
    const typeDefs = gql`
      type Query {
        getMethod: Test!
      }

      type Test {
        field: ID
        removeField: String
      }
    `;

    const resolvers = {
      Query: {
        getMethod: () => ({
          field: FIELD_VALUE,
          removeField: REMOVED_FIELD_VALUE,
        }),
      },
    };

    test('schema', () => {
      const schema = makeSchema({ typeDefs, resolvers });
      expect(
        (schema.getTypeMap().Test as GraphQLObjectType).getFields().removeField
      ).toBeUndefined();
    });

    test('right request', async () => {
      const schema = makeSchema({ typeDefs, resolvers });
      const { query } = testClient({ schema });
      const { errors } = await query({
        query: gql`
          {
            getMethod {
              field
            }
          }
        `,
      });

      expect(errors).toBeUndefined();
    });

    test('wrong request', async () => {
      const schema = makeSchema({ typeDefs, resolvers });
      const { query } = testClient({ schema });
      const { errors } = await query({
        query: gql`
          {
            getMethod {
              field
              removeField
            }
          }
        `,
      });
      expect(errors[0].message).toEqual(
        'Cannot query field "removeField" on type "Test".'
      );
    });
  });

  describe('GraphQLInputObject empty', () => {
    const typeDefs = gql`
      type Query {
        otherMethod: String
      }

      type Mutation {
        updateMethod(data: Test): String
      }

      input Test {
        removeField: String
      }
    `;

    test('schema', () => {
      const schema = makeSchema({ typeDefs });
      expect(schema.getTypeMap().Test).toBeUndefined();
    });

    test('wrong request', async () => {
      const schema = makeSchema({ typeDefs });
      const { mutate } = testClient({ schema });
      const { errors } = await mutate({
        mutation: gql`
          mutation {
            updateMethod(data: { removeField: "123" })
          }
        `,
      });
      expect(errors[0].message).toEqual(
        'Unknown argument "data" on field "updateMethod" of type "Mutation".'
      );
    });
  });

  describe('GraphQLInputObject', () => {
    const typeDefs = gql`
      type Query {
        otherMethod: String
      }

      type Mutation {
        updateMethod(data: Test): String
        methodWithScalarArg(data: Int): String
        methodWithScalarArrayArg(data: [Int]): String
      }

      input Test {
        field: ID
        removeField: String!
        nestedInput: TestNestedInput
      }

      input TestNestedInput {
        defaultField: String
      }
    `;

    const resolvers = {
      Mutation: {
        updateMethod: (_, args) => {
          return JSON.stringify(args);
        },
        methodWithScalarArg: (_, args) => {
          return JSON.stringify(args);
        },
        methodWithScalarArrayArg: (_, args) => {
          return JSON.stringify(args);
        },
      },
    };

    test('schema', () => {
      const schema = makeSchema({ typeDefs });
      expect(
        (schema.getTypeMap().Test as GraphQLObjectType).getFields().removeField
      ).toBeUndefined();
    });

    test('right request', async () => {
      const schema = makeSchema({ typeDefs, resolvers });
      const { mutate } = testClient({ schema });
      const { data, errors } = await mutate({
        mutation: gql`
          mutation {
            updateMethod(data: { field: "123" })
          }
        `,
      });
      expect(errors).toBeUndefined();
      expect(data.updateMethod).toMatch(
        `{"data":{"field":"123","removeField":"Test"}}`
      );
    });

    test('right request with variable', async () => {
      const schema = makeSchema({ typeDefs, resolvers });
      const { mutate } = testClient({ schema });
      const { data, errors } = await mutate({
        mutation: gql`
          mutation($id: ID!) {
            updateMethod(data: { field: $id })
          }
        `,
        variables: { id: '123' },
      });
      expect(errors).toBeUndefined();
      expect(data.updateMethod).toMatch(
        `{"data":{"field":"123","removeField":"Test"}}`
      );
    });

    test('right request with arg variable', async () => {
      const schema = makeSchema({ typeDefs, resolvers });
      const { mutate } = testClient({ schema });
      const { data, errors } = await mutate({
        mutation: gql`
          mutation($data: Test) {
            updateMethod(data: $data)
          }
        `,
        variables: { data: { field: '123', nestedInput: {} } },
      });
      expect(errors).toBeUndefined();
      expect(data.updateMethod).toMatch(
        `{"data":{"field":"123","removeField":"Test","nestedInput":{"defaultField":"DefaultValue"}}}`
      );
    });

    test('undefined scalar arg variable', async () => {
      const schema = makeSchema({ typeDefs, resolvers });
      const { mutate } = testClient({ schema });
      const { data, errors } = await mutate({
        mutation: gql`
          mutation($data: Int) {
            methodWithScalarArg(data: $data)
          }
        `,
      });
      expect(errors).toBeUndefined();
      expect(data.methodWithScalarArg).toMatch(`{}`);
    });

    test('scalar array arg variable', async () => {
      const schema = makeSchema({ typeDefs, resolvers });
      const { mutate } = testClient({ schema });
      const { data, errors } = await mutate({
        mutation: gql`
          mutation($data: [Int]) {
            methodWithScalarArrayArg(data: $data)
          }
        `,
        variables: {
          data: [1, 2],
        },
      });
      expect(errors).toBeUndefined();
      expect(data.methodWithScalarArrayArg).toMatch(`{"data":[1,2]}`);
    });

    test('undefined scalar array arg variable', async () => {
      const schema = makeSchema({ typeDefs, resolvers });
      const { mutate } = testClient({ schema });
      const { data, errors } = await mutate({
        mutation: gql`
          mutation($data: [Int]) {
            methodWithScalarArrayArg(data: $data)
          }
        `,
      });
      expect(errors).toBeUndefined();
      expect(data.methodWithScalarArrayArg).toMatch(`{}`);
    });

    test('wrong type scalar array arg variable', async () => {
      const schema = makeSchema({ typeDefs, resolvers });
      const { mutate } = testClient({ schema });
      const { errors } = await mutate({
        mutation: gql`
          mutation($data: Int) {
            methodWithScalarArrayArg(data: $data)
          }
        `,
      });
      expect(errors).toMatchInlineSnapshot(`
        Array [
          [ValidationError: Variable "$data" of type "Int" used in position expecting type "[Int]".],
        ]
      `);
    });

    test('right request with undefined arg variable', async () => {
      const schema = makeSchema({ typeDefs, resolvers });
      const { mutate } = testClient({ schema });
      const { data, errors } = await mutate({
        mutation: gql`
          mutation($data: Test) {
            updateMethod(data: $data)
          }
        `,
        variables: {},
      });
      expect(errors).toBeUndefined();
      expect(data.updateMethod).toMatch(`{"data":{"removeField":"Test"}}`);
    });

    test('right request with undefined nested variable', async () => {
      const schema = makeSchema({ typeDefs, resolvers });
      const { mutate } = testClient({ schema });
      const { data, errors } = await mutate({
        mutation: gql`
          mutation($data: TestNestedInput) {
            updateMethod(data: { nestedInput: $data })
          }
        `,
        variables: {},
      });
      expect(errors).toBeUndefined();
      expect(data.updateMethod).toMatch(`{"data":{"removeField":"Test"}}`);
    });

    test('wrong request', async () => {
      const schema = makeSchema({ typeDefs });
      const { mutate } = testClient({ schema });
      const { errors } = await mutate({
        mutation: gql`
          mutation {
            updateMethod(data: { removeField: "123" })
          }
        `,
      });
      expect(errors[0].message).toEqual(
        'Field "removeField" is not defined by type Test.'
      );
    });
  });

  describe('filter GraphQLEnum empty', () => {
    const typeDefs = gql`
      type Query {
        otherMethod: String
        getEnum: TestEnum
      }

      type Mutation {
        updateMethod(data: Test): String
      }

      input Test {
        field: ID
        defaultField: TestEnum!
      }

      enum TestEnum {
        removeField
      }
    `;

    test('schema', () => {
      const schema = makeSchema({ typeDefs });
      expect(schema.getTypeMap().TestEnum).toBeUndefined();
      expect(
        (schema.getTypeMap().Test as GraphQLObjectType).getFields().enumInput
      ).toBeUndefined();
    });

    // Broken test. Solution needed.
    // test('right request', async () => {
    //   let schema = makeSchema({ typeDefs });
    //   const { mutate } = testClient({ schema });
    //   const { data, errors } = await mutate({
    //     query: gql`
    //       mutation {
    //         updateMethod(data: {})
    //       }
    //     `,
    //   });
    //
    //   expect(errors).toBeUndefined();
    // });
  });

  describe('filter GraphQLEnum', () => {
    const typeDefs = gql`
      type Query {
        otherMethod: String
        getEnum: TestEnum
      }

      type Mutation {
        updateMethod(data: Test): String
      }

      input Test {
        field: ID
        defaultField: TestEnum!
      }

      enum TestEnum {
        DefaultValue
        removeField
      }
    `;

    test('schema', () => {
      const schema = makeSchema({ typeDefs });

      expect(
        (schema.getTypeMap().TestEnum as GraphQLEnumType)
          .getValues()
          .find(item => item.name === 'removeField')
      ).toBeUndefined();
    });

    test('wrong request', async () => {
      const schema = makeSchema({ typeDefs });
      const { mutate } = testClient({ schema });
      const { errors } = await mutate({
        mutation: gql`
          mutation {
            updateMethod(data: { defaultField: removeField })
          }
        `,
      });

      expect(errors[0].message).toEqual(
        'Expected type TestEnum, found removeField.'
      );
    });

    test('right request', async () => {
      const schema = makeSchema({ typeDefs });
      const { mutate } = testClient({ schema });
      const { errors } = await mutate({
        mutation: gql`
          mutation {
            updateMethod(data: { defaultField: DefaultValue })
          }
        `,
      });

      expect(errors).toBeUndefined();
    });
  });

  describe('remove empty type', () => {
    const typeDefs = gql`
      type Query {
        post: Post
      }

      type Post {
        id: ID
        title: String
        meta: Meta
      }

      type Meta {
        keywords: [Keyword]
      }

      type Keyword {
        removeField: String
      }
    `;

    test('schema', async () => {
      const schema = makeSchema({ typeDefs });

      expect(schema.getTypeMap().Meta).toBeUndefined();
    });
  });

  describe('remove empty input', () => {
    const typeDefs = gql`
      type Query {
        post: Post
      }

      type Mutation {
        createPost(data: PostCreateInput!): Post
      }

      type Post {
        id: ID
        title: String
        meta: Meta!
      }

      type Meta {
        slug: String!
      }

      input PostCreateInput {
        title: String
        defaultCreateField: MetaCreateOneNestedInput!
      }

      input MetaCreateOneNestedInput {
        create: MetaCreateInput
      }

      input MetaCreateInput {
        removeField: String!
      }
    `;

    test('schema', async () => {
      const schema = makeSchema({ typeDefs });

      expect(schema.getTypeMap().MetaCreateOneNestedInput).toBeUndefined();
    });

    test('right request', async () => {
      const schema = makeSchema({ typeDefs });
      const { mutate } = testClient({ schema });
      const { errors } = await mutate({
        mutation: gql`
          mutation {
            createPost(data: { title: "123" }) {
              id
            }
          }
        `,
      });

      expect(errors).toBeUndefined();
    });
  });

  describe('cutom scalar', () => {
    const typeDefs = gql`
      scalar JSON

      type Query {
        post: Post
      }

      type Post {
        id: ID
        postData: JSON
      }

      input CreatePostInput {
        postData: JSON
      }

      type Mutation {
        createPost(data: CreatePostInput): Post
      }
    `;

    const resolvers = {
      Mutation: {
        createPost: (parent, { data }) => {
          return data;
        },
      },
    };

    test('JSON scalar', async () => {
      const schema = makeSchema({ typeDefs, resolvers });
      const { mutate } = testClient({ schema });
      const { data, errors } = await mutate({
        mutation: gql`
          mutation {
            createPost(data: { postData: { test: "value" } }) {
              postData
            }
          }
        `,
      });
      expect(errors).toBeUndefined();
      expect(data.createPost).toEqual({ postData: { test: 'value' } });
    });

    test('JSON scalar multiple nested objects', async () => {
      const schema = makeSchema({ typeDefs, resolvers });
      const { mutate } = testClient({ schema });
      const { data, errors } = await mutate({
        mutation: gql`
          mutation {
            createPost(
              data: { postData: { test1: { test2: { test3: "value" } } } }
            ) {
              postData
            }
          }
        `,
      });
      expect(errors).toBeUndefined();
      expect(data.createPost).toEqual({
        postData: { test1: { test2: { test3: 'value' } } },
      });
    });

    test('JSON scalar in variable', async () => {
      const schema = makeSchema({ typeDefs, resolvers });
      const { mutate } = testClient({ schema });
      const { data, errors } = await mutate({
        mutation: gql`
          mutation($data: JSON) {
            createPost(data: { postData: $data }) {
              postData
            }
          }
        `,
        variables: { data: { test1: { test2: { test3: 'value' } } } },
      });
      expect(errors).toBeUndefined();
      expect(data.createPost).toEqual({
        postData: { test1: { test2: { test3: 'value' } } },
      });
    });
  });

  describe('fragments', () => {
    const typeDefs = gql`
      type Query {
        post: Post
      }

      type Mutation {
        createPost(data: PostCreateInput!): Post
      }

      type Post {
        id: ID
        title: String
        meta: Meta!
      }

      type Meta {
        slug: String!
      }

      input PostCreateInput {
        title: String
        defaultCreateField: MetaCreateOneNestedInput!
      }

      input MetaCreateOneNestedInput {
        create: MetaCreateInput
      }

      input MetaCreateInput {
        removeField: String!
      }
    `;

    const Post = { title: 'Post title' };
    const resolvers = {
      Query: {
        post: () => {
          return Post;
        },
      },
    };

    test('right with fragment', async () => {
      const schema = makeSchema({ typeDefs, resolvers });
      const { query } = testClient({ schema });
      const { data, errors } = await query({
        query: gql`
          fragment Post on Post {
            title
          }
          query {
            post {
              ...Post
            }
          }
        `,
      });
      expect(errors).toBeUndefined();
      expect(data).toMatchObject({ post: Post });
    });
  });
});
