import { makeExecutableSchema, transformSchema } from 'graphql-tools';
const { ApolloServer, gql } = require('apollo-server');
const { createTestClient } = require('apollo-server-testing');

import SchemaFilter, {
  mapFieldForTypeStack,
  groupFields,
  reduceValues,
} from './';

test('mapFieldForTypeStack', () => {
  let input = {
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

  let output = {
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
  let filterFields = SchemaFilter(
    (type, field) => {
      return !/^.*\.removeField$/.test(`${type.name}.${field.name}`);
    },
    (type, field) => {
      if (/.*\.removeField/.test(`${type.name}.${field.name}`)) {
        return () => 'Test';
      }
    }
  );

  const makeSchema = params => {
    let schema = makeExecutableSchema(params);
    return transformSchema(schema, [filterFields]);
  };

  const testClient = params => {
    const server = new ApolloServer(params);
    return createTestClient(server);
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
      let schema = makeSchema({ typeDefs, resolvers });
      expect(schema.getTypeMap().Test).toBeUndefined();
    });

    test('wrong request', async () => {
      let schema = makeSchema({ typeDefs, resolvers });
      const { query } = testClient({ schema });
      const { data, errors } = await query({
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
      let schema = makeSchema({ typeDefs, resolvers });
      expect(schema.getTypeMap().Test.getFields().removeField).toBeUndefined();
    });

    test('right request', async () => {
      let schema = makeSchema({ typeDefs, resolvers });
      const { query } = testClient({ schema });
      const { data, errors } = await query({
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
      let schema = makeSchema({ typeDefs, resolvers });
      const { query } = testClient({ schema });
      const { data, errors } = await query({
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
      let schema = makeSchema({ typeDefs });
      expect(schema.getTypeMap().Test).toBeUndefined();
    });

    test('wrong request', async () => {
      let schema = makeSchema({ typeDefs });
      const { mutate } = testClient({ schema });
      const { data, errors } = await mutate({
        query: gql`
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
      }

      input Test {
        field: ID
        removeField: String!
      }
    `;

    test('schema', () => {
      let schema = makeSchema({ typeDefs });
      expect(schema.getTypeMap().Test.getFields().removeField).toBeUndefined();
    });

    test('right request', async () => {
      let schema = makeSchema({ typeDefs });
      const { mutate } = testClient({ schema });
      const { data, errors } = await mutate({
        query: gql`
          mutation {
            updateMethod(data: { field: "123" })
          }
        `,
      });
      expect(errors).toBeUndefined();
    });

    test('wrong request', async () => {
      let schema = makeSchema({ typeDefs });
      const { mutate } = testClient({ schema });
      const { data, errors } = await mutate({
        query: gql`
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
        enumInput: TestEnum!
      }

      enum TestEnum {
        removeField
      }
    `;

    test('schema', () => {
      let schema = makeSchema({ typeDefs });
      expect(schema.getTypeMap().TestEnum).toBeUndefined();
      expect(schema.getTypeMap().Test.getFields().enumInput).toBeUndefined();
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
        enumInput: TestEnum!
      }

      enum TestEnum {
        field
        removeField
      }
    `;

    test('schema', () => {
      let schema = makeSchema({ typeDefs });

      expect(
        schema
          .getTypeMap()
          .TestEnum.getValues()
          .find(item => item.name === 'removeField')
      ).toBeUndefined();
    });

    test('wrong request', async () => {
      let schema = makeSchema({ typeDefs });
      const { mutate } = testClient({ schema });
      const { data, errors } = await mutate({
        query: gql`
          mutation {
            updateMethod(data: { enumInput: removeField })
          }
        `,
      });

      expect(errors[0].message).toEqual(
        'Expected type TestEnum, found removeField.'
      );
    });

    test('right request', async () => {
      let schema = makeSchema({ typeDefs });
      const { mutate } = testClient({ schema });
      const { data, errors } = await mutate({
        query: gql`
          mutation {
            updateMethod(data: { enumInput: field })
          }
        `,
      });

      expect(errors).toBeUndefined();
    });
  });
});
