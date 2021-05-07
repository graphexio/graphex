require('dotenv').config();

import { ApolloServer } from 'apollo-server';
import { Op } from 'sequelize';
import AM from '@apollo-model/core';
import typeDefs from './model';
import SQ from './db';

const schema = new AM().makeExecutableSchema({
  typeDefs,
});

const strategies = {
  find: (params) => {
    return SQ.model(params.collection).findAll({
      where: params.selector,
      attributes: params.fields,
      limit: params.options.limit,
      offset: params.options.skip,
      raw: true,
    });
  },
  findOne: (params) => {
    return SQ.model(params.collection).findOne({
      where: params.selector,
      attributes: params.fields,
      limit: params.options.limit,
      offset: params.options.skip,
      raw: true,
    });
  },
};

const mapSelectorKeys = {
  $in: Op.in,
  $or: Op.or,
  $and: Op.and,
  $not: Op.not,
  $eq: Op.eq,
};

const mapSelector = (selector) => {
  if (Array.isArray(selector)) return selector.map(mapSelector);
  if (typeof selector !== 'object') return selector;

  return Object.fromEntries(
    Object.entries(selector ?? {}).map(([key, value]) => {
      return [mapSelectorKeys[key] ?? key, mapSelector(value)];
    })
  );
};

const server = new ApolloServer({
  schema,
  introspection: true,
  playground: true,
  context: () => ({
    queryExecutor: async (params) => {
      console.log(params);

      const mappedSelector = params?.selector
        ? mapSelector(params.selector)
        : undefined;

      console.log(mappedSelector);

      const res = await strategies[params.type]({
        ...params,
        selector: mappedSelector,
      });

      console.log(res);

      return res;
    },
  }),
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
