import AMM, { defaultConfig } from '@graphex/core';
import * as DirectiveImplements from '@graphex/directive-implements';
import * as TypeGeoJSON from '@graphex/type-geojson';
import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';
import { DocumentNode } from 'graphql';
import makeIntrospection from 'ra-data-graphql/lib/introspection';
import * as R from 'ramda';
import introspectionOptions from '../src/introspectionOptions';
import { IntrospectionResult } from '../src/introspectionResult';

export const prepareIntrospection = async (
  typeDefs: DocumentNode
): Promise<IntrospectionResult> => {
  const schema = new AMM({
    modules: [DirectiveImplements, TypeGeoJSON],
    options: {
      config: R.mergeDeepRight(defaultConfig, TypeGeoJSON.config),
    },
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

  const testClient = createTestClient(server as any);

  const introspection = await makeIntrospection(
    testClient,
    introspectionOptions
  );
  return new IntrospectionResult(introspection);
};
