import Graphex from '@graphex/core';

import QueryExecutor from '@graphex/mongodb-executor';

import { ApolloServer } from 'apollo-server';

import { getDb } from './db/connection';
import typeDefs from './model';

const schema = new Graphex({}).buildFederatedSchema({
  typeDefs,
});

export const server = new ApolloServer({
  schema,
  introspection: true,
  playground: true,
  context: () => ({
    queryExecutor: QueryExecutor(getDb),
  }),
});
