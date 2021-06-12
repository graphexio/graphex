import {
  SelectorOperators,
  createSelectorReducer,
} from '@graphex/abstract-datasource-adapter';

export const reduceSelector = createSelectorReducer<Record<string, any>>({
  toChunk: (key, value) => ({ [key]: value }),
  andToChunk: items => ({ $and: items }),
  orToChunk: items => ({ $or: items }),
  operatorToChunk: {
    [SelectorOperators.ALL]: (k, v) => ({ [k]: { $all: v } }),
    [SelectorOperators.CONTAINS]: (k, v) => ({
      [k]: { $regex: new RegExp(v) },
    }),
    [SelectorOperators.ENDS_WITH]: (k, v) => ({
      [k]: { $regex: new RegExp(`${v}$`) },
    }),
    [SelectorOperators.EXACT]: (k, v) => ({ [k]: { $eq: v } }),
    [SelectorOperators.EXISTS]: (k, v) => ({ [k]: { $exists: v } }),
    [SelectorOperators.GT]: (k, v) => ({ [k]: { $gt: v } }),
    [SelectorOperators.GTE]: (k, v) => ({ [k]: { $gte: v } }),
    [SelectorOperators.IN]: (k, v) => ({ [k]: { $in: v } }),
    [SelectorOperators.LT]: (k, v) => ({ [k]: { $lt: v } }),
    [SelectorOperators.LTE]: (k, v) => ({ [k]: { $lte: v } }),
    [SelectorOperators.NOT_IN]: (k, v) => ({ [k]: { $not: { $in: v } } }),
    [SelectorOperators.NOT_SIZE]: (k, v) => ({ [k]: { $not: { $size: v } } }),
    [SelectorOperators.NOT]: (k, v) => ({ [k]: { $not: { $eq: v } } }),
    [SelectorOperators.SIZE]: (k, v) => ({ [k]: { $size: v } }),
    [SelectorOperators.SOME]: (k, v) => ({ [k]: { $elemMatch: v } }),
    [SelectorOperators.STARTS_WITH]: (k, v) => ({
      [k]: { $regex: new RegExp(`^${v}`) },
    }),
  },
  mergeChunks: items => items.reduce((acc, val) => ({ ...acc, ...val }), {}),
});
