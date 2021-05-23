import { printType } from 'graphql';
import gql from 'graphql-tag';
import { generateSchema } from './generateSchema';

describe('empty', () => {
  const schema = generateSchema(gql`
    type Empty @model {
      title: String
    }
  `);

  test('Query', () => {
    expect(printType(schema.getQueryType())).toMatchInlineSnapshot(`
"type Query {
  empties(where: EmptyWhereInput, orderBy: EmptyOrderByInput, offset: Int, first: Int): [Empty!]!
  empty: Empty
  emptiesConnection(where: EmptyWhereInput, orderBy: EmptyOrderByInput, offset: Int, first: Int): EmptyConnection
}"
`);
  });
});
