import { printType } from 'graphql';
import gql from 'graphql-tag';
import { generateSchema } from './generateSchema';

describe('default', () => {
  const schema = generateSchema(
    gql`
      type Post @model {
        id: ID @id @unique @db(name: "_id")
        message: String! @default(value: "New post")
      }
    `
  );

  test('PostCreateInput', () => {
    expect(printType(schema.getType('PostCreateInput'))).toMatchInlineSnapshot(`
        "input PostCreateInput {
          message: String
        }"
    `);
  });
});
