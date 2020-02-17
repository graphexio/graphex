import {
  DocumentNode,
  execute,
  introspectionQuery,
  printSchema,
} from 'graphql';
import AMM, { AMOptions } from '@apollo-model/core';
import gql from 'graphql-tag';

import makeIntrospection from 'ra-data-graphql/lib/introspection';
import { IntrospectionResultData } from '../src/definitions';
import introspectionOptions from '../src/introspectionOptions';
import { createTestClient } from 'apollo-server-testing';
import { ApolloServer } from 'apollo-server';
import { IntrospectionResult } from '../src/introspectionResult';
import * as GeoJSON from '@apollo-model/type-geojson';

export const prepareIntrospection = async (
  typeDefs: DocumentNode
): Promise<IntrospectionResult> => {
  const schema = new AMM({
    modules: [GeoJSON],
  }).makeExecutableSchema({
    resolverValidationOptions: {
      requireResolversForResolveType: false,
    },
    typeDefs: [typeDefs],
  });
  //   console.log(printSchema(schema));

  const server = new ApolloServer({
    schema,
  });

  const testClient = createTestClient(server);

  const introspection = await makeIntrospection(
    testClient,
    introspectionOptions
  );
  return new IntrospectionResult(introspection);
};
