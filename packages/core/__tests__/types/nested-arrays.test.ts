import { validateSchema, printType } from 'graphql';
import gql from 'graphql-tag';
import { generateSchema } from './generateSchema';

describe('nested arrays', () => {
  const schema = generateSchema(
    gql`
      type Post @model {
        id: ID @id @unique @db(name: "_id")
        comments: [Comment] @subdocument
      }

      type Comment {
        message: String
      }

      interface Review @inherit {
        message: String
      }

      type HotelReview implements Review {
        rating: Int
      }

      interface Poi @inherit @model {
        id: ID @id @unique @db(name: "_id")
        reviews: [Review] @subdocument @noArrayFilter #disable interface filters due to https://github.com/graphql/graphql-spec/issues/629
      }

      type Hotel implements Poi {
        title: String
        reviews: [HotelReview] @subdocument
      }
    `
  );

  test('validate', () => {
    expect(validateSchema(schema)).toMatchObject([]);
  });

  test('Post', () => {
    expect(printType(schema.getType('Post'))).toMatchInlineSnapshot(`
"type Post {
  id: ID
  comments(where: CommentWhereInput, orderBy: CommentOrderByInput, offset: Int, first: Int): [Comment]
}"
`);
  });

  test('Poi', () => {
    expect(printType(schema.getType('Poi'))).toMatchInlineSnapshot(`
    "interface Poi {
      id: ID
      reviews: [Review]
    }"
`);
  });

  test('Hotel', () => {
    expect(printType(schema.getType('Hotel'))).toMatchInlineSnapshot(`
"type Hotel implements Poi {
  id: ID
  reviews(where: HotelReviewWhereInput, orderBy: HotelReviewOrderByInput, offset: Int, first: Int): [HotelReview]
  title: String
}"
`);
  });
});
