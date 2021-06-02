import Graphex from '@graphex/core';
import { applyRole } from '@graphex/acl';
import QueryExecutor from '@graphex/mongodb-executor';
import * as DirectiveImplements from '@graphex/directive-implements';
import { ApolloServer } from 'apollo-server';

import { getDb } from './db/connection';
import { runSeed } from './db/seed';
import typeDefs from './model';
import { anonymusRole } from './roles/anonymus';

const schema = new Graphex({
  options: { aclWhere: true },
  modules: [DirectiveImplements],
}).makeExecutableSchema({
  typeDefs,
});

const anonymusSchema = applyRole(schema, anonymusRole);

const aclServer = new ApolloServer({
  schema: anonymusSchema,
  introspection: true,
  playground: true,
  context: () => ({
    queryExecutor: QueryExecutor(getDb),
  }),
});

aclServer.listen({ port: 4000 }).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});

runSeed();
