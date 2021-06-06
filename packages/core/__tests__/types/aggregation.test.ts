import { printType } from 'graphql';
import gql from 'graphql-tag';
import { generateSchema } from './generateSchema';

describe('aggregation', () => {
  const schema = generateSchema(
    gql`
      type Dish @model {
        id: ID @id @unique @db(name: "_id")
        title: String
        price: Float!
        details: DishDetails
      }

      type DishDetails {
        weight: Float
      }
    `
  );

  test('AggregateDish', () => {
    expect(printType(schema.getType('AggregateDish'))).toMatchInlineSnapshot(`
      "type AggregateDish {
        count: Int!
        sum: AggregateNumericFieldsInDish
        min: AggregateNumericFieldsInDish
        max: AggregateNumericFieldsInDish
      }"
    `);
  });

  test('AggregateNumericFieldsInDish', () => {
    expect(printType(schema.getType('AggregateNumericFieldsInDish')))
      .toMatchInlineSnapshot(`
        "type AggregateNumericFieldsInDish {
          price: Float
          details: AggregateNumericFieldsInDishDetails
        }"
      `);
  });
});
