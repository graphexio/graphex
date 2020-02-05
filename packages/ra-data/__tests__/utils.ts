import { DocumentNode, execute, introspectionQuery } from 'graphql';
import AMM, { AMOptions } from '@apollo-model/core';
import gql from 'graphql-tag';

import makeIntrospection from 'ra-data-graphql/lib/introspection';
import { IntrospectionResult } from '../src/definitions';
import introspectionOptions from '../src/introspectionOptions';
import { createTestClient } from 'apollo-server-testing';
import { ApolloServer } from 'apollo-server';

export const prepareIntrospection = (
  typeDefs: DocumentNode
): IntrospectionResult => {
  const schema = new AMM({
    modules: [],
  }).makeExecutableSchema({
    resolverValidationOptions: {
      requireResolversForResolveType: false,
    },
    typeDefs: [typeDefs],
  });

  const server = new ApolloServer({
    schema,
  });

  const testClient = createTestClient(server);

  const introspection = makeIntrospection(testClient, introspectionOptions);
  return introspection;
};
