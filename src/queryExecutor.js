import pluralize from 'pluralize';
import _ from 'lodash';
import DataLoader from "dataloader";

export const FIND = 'find';
export const FIND_ONE = 'findOne';
export const FIND_IDS = 'findIds';
export const COUNT = 'count';
export const DISTINCT = 'distinct';
export const INSERT_ONE = 'insertOne';
export const INSERT_MANY = 'insertMany';
export const DELETE_ONE = 'deleteOne';
export const UPDATE_ONE = 'updateOne';
export const UPDATE_MANY = 'updateMany';

let dataLoaders = {};

const buildDataLoader = (db, collectionName, selectorField) => {
  let Collection = db.collection(collectionName);
  return new DataLoader(keys => {
    return Collection.find({[selectorField]: {$in: keys}}).toArray().then(data => keys.map(key => data.find(item => item[selectorField].toString() === key.toString()) || null));
  }, {cache: false});
};

export default ({db, hooks: {willGet, didGet, willCreate, didCreate, willUpdate, didUpdate, willDelete, didDelete}}) => async params => {
  let {type, collection: collectionName, doc, docs, selector, options = {}, context = {}} = params;
  // console.dir({ type, collection, selector, options }, { depth: null });
  let {skip, limit, sort, arrayFilters = []} = options;
  //
  // console.log('\n\n');
  // console.log({ type, collection });
  // console.log('selector');
  // console.dir(selector, { depth: null });
  // console.dir({ options });
  // console.log('doc');
  // console.dir(doc, { depth: null });
  // console.log('\n\n');
  
  let Collection = db.collection(collectionName);
  
  switch (type) {
    case FIND: {
      // let {selector} = willGet ? await willGet(params) : {selector};
      let cursor = Collection.find(selector);
      if (skip) cursor = cursor.skip(skip);
      if (limit) cursor = cursor.limit(limit);
      if (sort) cursor = cursor.sort(sort);
      return cursor.toArray().then(data => {
        return data;
        // return didGet ? didGet(data).then(() => data) : data
      });
    }
    case FIND_ONE: {
      // let {selector} = willGet ? await willGet(params) : {selector};
      const dataLoaderKey = `${collectionName}:${options.selectorField}`;
      if (!Object.keys(dataLoaders).includes(dataLoaderKey)) {
        dataLoaders[dataLoaderKey] = buildDataLoader(db, collectionName, options.selectorField);
      }
      let dataLoader = dataLoaders[dataLoaderKey];
      return options.id ? dataLoader.load(options.id) : Promise.resolve(null);
    }
    case FIND_IDS: {
      const dataLoaderKey = `${collectionName}:${options.selectorField}`;
      if (!Object.keys(dataLoaders).includes(dataLoaderKey)) {
        dataLoaders[dataLoaderKey] = buildDataLoader(db, collectionName, options.selectorField);
      }
      let dataLoader = dataLoaders[dataLoaderKey];
      if (!options.ids) {
        options.ids = [];
      }
      
      if (!Array.isArray(options.ids)) {
        options.ids = [options.ids];
      }
      return dataLoader.loadMany(options.ids);
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
      return Collection.findOneAndUpdate(selector, doc, {
        returnOriginal: false,
        arrayFilters,
      }).then(res => res.value);
    }
  }
  return null;
};
