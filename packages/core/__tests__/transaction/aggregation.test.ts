import gql from 'graphql-tag';
import { generateSchema } from './generateSchema';
import { prepareTransaction } from './prepareTransaction';

describe('aggregation', () => {
  const schema = generateSchema(
    gql`
      type Dish @model {
        id: ID @id @unique @db(name: "_id")
        title: String!
        price: Int
        details: DishDetails
      }

      type DishDetails @embedded {
        weight: Float
      }
    `
  );

  test.skip('min max', () => {
    const rq = gql`
      query {
        dishesConnection(where: { price_lt: 10000 }) {
          aggregate {
            min {
              price
            }
            max {
              price
            }
          }
        }
      }
    `;

    const transaction = prepareTransaction(schema, rq);
    expect(transaction).toMatchInlineSnapshot(`
Object {
  "operations": Array [
    Object {
      "collectionName": "dishes",
      "fieldsSelection": Object {
        "fields": Array [
          "aggregate.min.price",
          "aggregate.max.price",
        ],
      },
      "identifier": "Operation-0",
      "kind": "AMAggregateOperation",
      "many": false,
      "output": ResultPromise {
        "source": Array [
          "Operation-0",
        ],
      },
      "selector": Object {
        "price": Object {
          "$lt": 10000,
        },
      },
    },
  ],
}
`);
  });
});
