import { ApolloServer } from 'apollo-server';
import AMM from '@apollo-model/core';
import QueryExecutor from '@apollo-model/mongodb-executor';
import { MongoClient, ObjectID } from 'mongodb';
import typeDefs from './model';
import MongoMemoryServer from 'mongodb-memory-server';
import * as DirectiveImplements from '@apollo-model/directive-implements';
import * as TypeGeoJSON from '../src';
import { defaultConfig } from '@apollo-model/core';

import * as R from 'ramda';
const util = require('util');

export const mongod = new MongoMemoryServer();
const uri = mongod.getConnectionString();
const dbName = mongod.getDbName();

let DB = null;

export const connectToDatabase = () => {
  if (DB && DB.serverConfig.isConnected()) {
    return Promise.resolve(DB);
  }
  return Promise.all([uri, dbName]).then(([uri, dbName]) =>
    MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then(client => {
      DB = client.db(dbName);
      return DB;
    })
  );
};

const QE = QueryExecutor(connectToDatabase);

const schema = new AMM({
  modules: [DirectiveImplements, TypeGeoJSON],
  options: {
    config: R.mergeDeepRight(defaultConfig, TypeGeoJSON.config),
  },
}).makeExecutableSchema({
  resolverValidationOptions: {
    requireResolversForResolveType: false,
  },
  typeDefs,
});

export const server = new ApolloServer({
  schema,
  context: () => {
    return {
      queryExecutor: async params => {
        // console.log(util.inspect(params, { showHidden: false, depth: null }));
        // console.log(params);
        let result = await QE(params);
        // console.log(params, result);
        return result;
      },
    };
  },
  introspection: true,
  playground: true,
  formatError: error => {
    // console.log(error);
    // console.dir(error.extensions);
    return error;
  },
});

const { createTestClient } = require('apollo-server-testing');
export const { query, mutate } = createTestClient(server);
