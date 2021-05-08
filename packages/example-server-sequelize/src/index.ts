require('dotenv').config();

import { ApolloServer } from 'apollo-server';
import AM from '@apollo-model/core';
import typeDefs from './model';
import SequelizeExecutor from '@apollo-model/sequelize-executor';
import SQ from './db';

const schema = new AM().makeExecutableSchema({
  typeDefs,
});

const Executor = SequelizeExecutor(SQ);

const server = new ApolloServer({
  schema,
  introspection: true,
  playground: true,
  context: () => ({
    queryExecutor: async (params) => {
      // console.log(params);
      const res = await Executor(params);
      // console.log(res);
      return res;
    },
  }),
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
