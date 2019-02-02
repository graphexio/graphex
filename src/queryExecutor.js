import pluralize from 'pluralize';
import _ from 'lodash';
import DataLoader from 'dataloader';
import ObjectHash from 'object-hash';

export const FIND = 'find';
export const FIND_ONE = 'findOne';
export const FIND_IDS = 'findIds';
export const COUNT = 'count';
export const DISTINCT = 'distinct';
export const INSERT_ONE = 'insertOne';
export const INSERT_MANY = 'insertMany';
export const DELETE_ONE = 'deleteOne';
export const DELETE_MANY = 'deleteMany';
export const UPDATE_ONE = 'updateOne';
export const UPDATE_MANY = 'updateMany';

let dataLoaders = {};

const getDataLoader = (db, collectionName, selectorField, selector = {}) => {
  let key = ObjectHash({ collectionName, selectorField, selector });
  if (!dataLoaders[key]) {
    let Collection = db.collection(collectionName);
    dataLoaders[key] = new DataLoader(
      keys => {
        return Collection.find({ [selectorField]: { $in: keys }, ...selector })
          .toArray()
          .then(data =>
            keys.map(
              key =>
                data.find(
                  item => item[selectorField].toString() === key.toString()
                ) || null
            )
          );
      },
      { cache: false }
    );
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
    context = {},
  } = params;
  // console.dir({ type, collection, selector, options }, { depth: null });
  let { skip, limit, sort, arrayFilters = [] } = options;
  //
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
    case FIND: {
      let cursor = Collection.find(selector);
      if (skip) cursor = cursor.skip(skip);
      if (limit) cursor = cursor.limit(limit);
      if (sort) cursor = cursor.sort(sort);
      return cursor
        .toArray()
        .then(data => {
          return data;
        })
        .catch(e => {
          console.log(e);
        });
    }
    case FIND_ONE: {
      return Collection.findOne(selector);
    }
    case FIND_IDS: {
      selector = {
        ..._.omit(selector, options.selectorField),
      };
      //BUG selectorField may be in nested operator ($and for example)
      if (!options.ids) {
        options.ids = [];
      }

      if (!Array.isArray(options.ids)) {
        options.ids = [options.ids];
      }
      return getDataLoader(
        db,
        collectionName,
        options.selectorField,
        selector
      ).loadMany(options.ids);
    }
    case COUNT: {
      let cursor = Collection.find(selector);
      if (skip) cursor = cursor.skip(skip);
      if (limit) cursor = cursor.limit(limit);
      if (sort) cursor = cursor.sort(sort);
      return cursor.count(true);
    }
    case DISTINCT: {
      let cursor = Collection.find(selector);
      if (skip) cursor = cursor.skip(skip);
      if (limit) cursor = cursor.limit(limit);
      if (sort) cursor = cursor.sort(sort);
      return cursor.toArray().then(data => data.map(item => item[options.key]));
    }
    case INSERT_ONE: {
      return Collection.insertOne(doc).then(res => _.head(res.ops));
    }
    case INSERT_MANY: {
      return Collection.insertMany(docs).then(res => res.ops);
    }

    case DELETE_MANY: {
      return Collection.deleteMany(selector).then(res => res.deletedCount);
    }

    case DELETE_ONE: {
      return Collection.findOneAndDelete(selector).then(res => res.value);
    }
    case UPDATE_MANY: {
      return Collection.updateMany(selector, docs, { arrayFilters }).then(
        res => res.ops
      );
    }
    case UPDATE_ONE: {
      return Collection.findOneAndUpdate(selector, doc, {
        returnOriginal: false,
        arrayFilters,
      }).then(res => res.value);
    }
  }
  return null;
};
export default queryExecutor;
