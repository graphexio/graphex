"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.UPDATE_MANY = exports.UPDATE_ONE = exports.DELETE_MANY = exports.DELETE_ONE = exports.INSERT_MANY = exports.INSERT_ONE = exports.DISTINCT = exports.COUNT = exports.FIND_IDS = exports.FIND_ONE = exports.FIND = void 0;

var _pluralize = _interopRequireDefault(require("pluralize"));

var _lodash = _interopRequireDefault(require("lodash"));

var _dataloader = _interopRequireDefault(require("dataloader"));

var _objectHash = _interopRequireDefault(require("object-hash"));

const FIND = 'find';
exports.FIND = FIND;
const FIND_ONE = 'findOne';
exports.FIND_ONE = FIND_ONE;
const FIND_IDS = 'findIds';
exports.FIND_IDS = FIND_IDS;
const COUNT = 'count';
exports.COUNT = COUNT;
const DISTINCT = 'distinct';
exports.DISTINCT = DISTINCT;
const INSERT_ONE = 'insertOne';
exports.INSERT_ONE = INSERT_ONE;
const INSERT_MANY = 'insertMany';
exports.INSERT_MANY = INSERT_MANY;
const DELETE_ONE = 'deleteOne';
exports.DELETE_ONE = DELETE_ONE;
const DELETE_MANY = 'deleteMany';
exports.DELETE_MANY = DELETE_MANY;
const UPDATE_ONE = 'updateOne';
exports.UPDATE_ONE = UPDATE_ONE;
const UPDATE_MANY = 'updateMany';
exports.UPDATE_MANY = UPDATE_MANY;
let dataLoaders = {};

const getDataLoader = (db, collectionName, selectorField, selector = {}) => {
  let key = (0, _objectHash.default)({
    collectionName,
    selectorField,
    selector
  });

  if (!dataLoaders[key]) {
    let Collection = db.collection(collectionName);
    dataLoaders[key] = new _dataloader.default(keys => {
      return Collection.find({
        [selectorField]: {
          $in: keys
        },
        ...selector
      }).toArray().then(data => keys.map(key => data.find(item => item[selectorField].toString() === key.toString()) || null));
    }, {
      cache: false
    });
  }

  return dataLoaders[key];
};

const queryExecutor = DB => async params => {
  const db = await DB;
  let {
    type,
    collection: collectionName,
    doc,
    docs,
    selector,
    options = {},
    context = {}
  } = params; // console.dir({ type, collection, selector, options }, { depth: null });

  let {
    skip,
    limit,
    sort,
    arrayFilters = []
  } = options; //
  // console.log('\n\n');
  // console.log({ type, collectionName });
  // console.log('selector');
  // console.dir(selector, { depth: null });
  // console.dir({ options });
  // console.log('doc');
  // console.dir(doc, { depth: null });
  // console.log('\n\n');

  let Collection = db.collection(collectionName);

  switch (type) {
    case FIND:
      {
        let cursor = Collection.find(selector);
        if (skip) cursor = cursor.skip(skip);
        if (limit) cursor = cursor.limit(limit);
        if (sort) cursor = cursor.sort(sort);
        return cursor.toArray().then(data => {
          return data;
        }).catch(e => {
          console.log(e);
        });
      }

    case FIND_ONE:
      {
        return Collection.findOne(selector);
      }

    case FIND_IDS:
      {
        selector = { ..._lodash.default.omit(selector, options.selectorField)
        }; //BUG selectorField may be in nested operator ($and for example)

        if (!options.ids) {
          options.ids = [];
        }

        if (!Array.isArray(options.ids)) {
          options.ids = [options.ids];
        }

        return getDataLoader(db, collectionName, options.selectorField, selector).loadMany(options.ids);
      }

    case COUNT:
      {
        let cursor = Collection.find(selector);
        if (skip) cursor = cursor.skip(skip);
        if (limit) cursor = cursor.limit(limit);
        if (sort) cursor = cursor.sort(sort);
        return cursor.count(true);
      }

    case DISTINCT:
      {
        let cursor = Collection.find(selector);
        if (skip) cursor = cursor.skip(skip);
        if (limit) cursor = cursor.limit(limit);
        if (sort) cursor = cursor.sort(sort);
        return cursor.toArray().then(data => data.map(item => item[options.key]));
      }

    case INSERT_ONE:
      {
        return Collection.insertOne(doc).then(res => _lodash.default.head(res.ops));
      }

    case INSERT_MANY:
      {
        return Collection.insertMany(docs).then(res => res.ops);
      }

    case DELETE_MANY:
      {
        return Collection.deleteMany(selector).then(res => res.deletedCount);
      }

    case DELETE_ONE:
      {
        return Collection.findOneAndDelete(selector).then(res => res.value);
      }

    case UPDATE_MANY:
      {
        return Collection.updateMany(selector, docs, {
          arrayFilters
        }).then(res => res.ops);
      }

    case UPDATE_ONE:
      {
        return Collection.findOneAndUpdate(selector, doc, {
          returnOriginal: false,
          arrayFilters
        }).then(res => res.value);
      }
  }

  return null;
};

var _default = queryExecutor;
exports.default = _default;