import { printType } from 'graphql';
import gql from 'graphql-tag';
import { generateSchema } from './generateSchema';

describe('where', () => {
  const schema = generateSchema(gql`
    type Post @model {
      id: ID @id @unique @db(name: "_id")
      title: String
      status: String @readonly
    }
  `);

  const postWhereInputType = schema.getType('PostWhereInput');

  test('schema', () => {
    expect(printType(postWhereInputType)).toMatchInlineSnapshot(`
      "input PostWhereInput {
        AND: [PostWhereInput]
        OR: [PostWhereInput]
        id_exists: Boolean
        id_in: [ID]
        id_not_in: [ID]
        id: ID
        id_not: ID
        title_exists: Boolean
        title_in: [String]
        title_not_in: [String]
        title: String
        title_lt: String
        title_lte: String
        title_gt: String
        title_gte: String
        title_not: String
        title_contains: String
        title_starts_with: String
        title_ends_with: String
        status_exists: Boolean
        status_in: [String]
        status_not_in: [String]
        status: String
        status_lt: String
        status_lte: String
        status_gt: String
        status_gte: String
        status_not: String
        status_contains: String
        status_starts_with: String
        status_ends_with: String
      }"
    `);
  });
});