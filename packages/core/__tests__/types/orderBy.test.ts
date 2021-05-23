import { printType } from 'graphql';
import gql from 'graphql-tag';
import { generateSchema } from './generateSchema';

describe('orderBy', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      pinnedComment: Comment
      comments: [Comment!]
    }

    type Comment @embedded {
      message: String
    }
  `);

  const orderByType = schema.getType('PostOrderByInput');

  test('schema', () => {
    expect(printType(orderByType)).toMatchInlineSnapshot(`
              "enum PostOrderByInput {
                id_ASC
                id_DESC
                title_ASC
                title_DESC
              }"
            `);
  });

  test('values', () => {
    expect(orderByType.toConfig()).toMatchInlineSnapshot(`
      Object {
        "astNode": undefined,
        "description": undefined,
        "extensionASTNodes": Array [],
        "extensions": undefined,
        "name": "PostOrderByInput",
        "values": Object {
          "id_ASC": Object {
            "astNode": undefined,
            "deprecationReason": undefined,
            "description": undefined,
            "extensions": undefined,
            "value": Object {
              "_id": 1,
            },
          },
          "id_DESC": Object {
            "astNode": undefined,
            "deprecationReason": undefined,
            "description": undefined,
            "extensions": undefined,
            "value": Object {
              "_id": -1,
            },
          },
          "title_ASC": Object {
            "astNode": undefined,
            "deprecationReason": undefined,
            "description": undefined,
            "extensions": undefined,
            "value": Object {
              "title": 1,
            },
          },
          "title_DESC": Object {
            "astNode": undefined,
            "deprecationReason": undefined,
            "description": undefined,
            "extensions": undefined,
            "value": Object {
              "title": -1,
            },
          },
        },
      }
    `);
  });
});
