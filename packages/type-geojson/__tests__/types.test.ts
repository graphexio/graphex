import { printType } from 'graphql';
import gql from 'graphql-tag';
import AMM from '@graphex/core';
import { AMOptions } from '@graphex/core/lib/definitions';
import * as TypeGeoJSON from '../src';
import * as R from 'ramda';
import { defaultConfig } from '@graphex/core';

const generateSchema = (
  typeDefs,
  options: AMOptions = {
    config: R.mergeDeepRight(defaultConfig, TypeGeoJSON.config),
  }
) => {
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
        pois(where: PoiWhereInput, orderBy: PoiOrderByInput, offset: Int, first: Int): [Poi!]!
        poi(where: PoiWhereUniqueInput): Poi
        poisConnection(where: PoiWhereInput, orderBy: PoiOrderByInput, offset: Int, first: Int): PoiConnection
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
