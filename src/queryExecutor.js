import pluralize from 'pluralize';
import _ from 'lodash';

export const FIND = 'find';
export const FIND_ONE = 'findOne';
export const COUNT = 'count';
export const DISTINCT = 'distinct';
export const INSERT_ONE = 'insertOne';
export const INSERT_MANY = 'insertMany';
export const DELETE_ONE = 'deleteOne';
export const UPDATE_ONE = 'updateOne';
export const UPDATE_MANY = 'updateMany';

export default db => async params => {
  var { type, collection, doc, docs, selector, options = {} } = params;
  // console.dir({ type, collection, selector, options }, { depth: null });
  let { skip, limit, sort } = options;

  // console.log({ type, collection });
  // console.log('selector');
  // console.dir(selector, { depth: null });
  // console.dir({ skip, limit });
  // console.log('doc');
  // console.dir(doc, { depth: null });

  let collectionName = pluralize(collection.toLowerCase());
  let Collection = db.collection(collectionName);

  switch (type) {
    case FIND: {
      let cursor = Collection.find(selector);
      if (skip) cursor = cursor.skip(skip);
      if (limit) cursor = cursor.limit(limit);
      if (sort) cursor = cursor.sort(sort);
      return cursor.toArray();
    }
    case FIND_ONE: {
      return Collection.findOne(selector);
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
    case DELETE_ONE: {
      return Collection.findOneAndDelete(selector).then(res => res.value);
    }
    case UPDATE_ONE: {
      return Collection.findOneAndUpdate(
        selector,
        { $set: doc },
        { returnOriginal: false }
      ).then(res => res.value);
    }
  }
  return null;
};
