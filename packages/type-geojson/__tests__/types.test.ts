import { printType } from 'graphql';
import gql from 'graphql-tag';
import AMM from '@apollo-model/core';
import { AMOptions } from '@apollo-model/core/lib/definitions';
import * as TypeGeoJSON from '../src';

const generateSchema = (typeDefs, options?: AMOptions) => {
  return new AMM({ options, modules: [TypeGeoJSON] }).makeExecutableSchema({
    resolverValidationOptions: {
      requireResolversForResolveType: false,
    },
    typeDefs,
  });
};

describe('interface', () => {
  const schema = generateSchema(gql`
    type Poi @model {
      id: ID @id @unique @db(name: "_id")
      geometry: GeoJSONPoint
    }
  `);

  test('Query', () => {
    expect(printType(schema.getQueryType())).toMatchInlineSnapshot(`
      "type Query {
        pois(where: PoiWhereInput, orderBy: PoiOrderByInput, skip: Int, first: Int): [Poi!]!
        poi(where: PoiWhereUniqueInput): Poi
        poisConnection(where: PoiWhereInput, skip: Int, first: Int): PoiConnection
      }"
    `);
  });
  test('Mutation', () => {
    expect(printType(schema.getMutationType())).toMatchInlineSnapshot(`
      "type Mutation {
        createPoi(data: PoiCreateInput!): Poi
        deletePoi(where: PoiWhereUniqueInput!): Poi
        deletePois(where: PoiWhereInput!): Int!
        updatePoi(data: PoiUpdateInput!, where: PoiWhereUniqueInput!): Poi
      }"
    `);
  });

  test('PoiUpdateInput', () => {
    expect(printType(schema.getType('PoiUpdateInput'))).toMatchInlineSnapshot(`
"input PoiUpdateInput {
  geometry: GeoJSONPointInput
}"
`);
  });
});
