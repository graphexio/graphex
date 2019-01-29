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

const buildDataLoaderWithSelector = (db, collectionName, selectorField, selector = {}) => {
  let Collection = db.collection(collectionName);
  return new DataLoader(keys => {
    return Collection.find({[selectorField]: {$in: keys}, ...selector}).toArray().then(data => keys.map(key => data.find(item => item[selectorField].toString() === key.toString()) || null));
  }, {cache: false});
};

const hasDataLoader = (key) => {
  return Object.keys(dataLoaders).includes(key);
};

const dataLoaderKey = (collectionName, selectorField, selector = {}) => {
  let params = Object.entries(selector).sort((a, b) => {
    return a[0] > b[0]
  }).map(([k, v]) => {
    return `${k}:${JSON.stringify(v)}`;
  });
  if (params) {
    params = ":" + params.join(':')
  }
  let key = `${collectionName}:${selectorField}${params}`;
  console.log(key);
  return key;
  
};

let dbResolver = (t, c, data) => {
  return data;
};


export default ({db, hooks = {}, dbResolve = dbResolver}) => async params => {
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
      selector = dbResolve(FIND, collectionName, selector, context);
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
    case FIND_ONE: {
      selector = dbResolve(FIND, collectionName, selector, context);
      options.id = options.id || selector[options.selectorField];
      selector = {
        ..._.omit(selector, options.selectorField)
      };
      const dlKey = dataLoaderKey(collectionName, options.selectorField, selector);
      if (!hasDataLoader(dlKey)) {
        dataLoaders[dlKey] = buildDataLoaderWithSelector(db, collectionName, options.selectorField, selector);
      }
      let dataLoader = dataLoaders[dlKey];
      return options.id ? dataLoader.load(options.id) : Promise.resolve(null);
    }
    case FIND_IDS: {
      selector = dbResolve(FIND, collectionName, selector, context);
      selector = {
        ..._.omit(selector, options.selectorField)
      };
      const dlKey = dataLoaderKey(collectionName, options.selectorField, selector);
      if (!hasDataLoader(dlKey)) {
        dataLoaders[dlKey] = buildDataLoaderWithSelector(db, collectionName, options.selectorField, selector);
      }
      let dataLoader = dataLoaders[dlKey];
      if (!options.ids) {
        options.ids = [];
      }
      
      if (!Array.isArray(options.ids)) {
        options.ids = [options.ids];
      }
      return dataLoader.loadMany(options.ids);
    }
    case COUNT: {
      selector = dbResolve(FIND, collectionName, selector, context);
      let cursor = Collection.find(selector);
      if (skip) cursor = cursor.skip(skip);
      if (limit) cursor = cursor.limit(limit);
      if (sort) cursor = cursor.sort(sort);
      return cursor.count(true);
    }
    case DISTINCT: {
      selector = dbResolve(FIND, collectionName, selector, context);
      let cursor = Collection.find(selector);
      if (skip) cursor = cursor.skip(skip);
      if (limit) cursor = cursor.limit(limit);
      if (sort) cursor = cursor.sort(sort);
      return cursor.toArray().then(data => data.map(item => item[options.key]));
    }
    case INSERT_ONE: {
      doc = dbResolve(INSERT_ONE + "Pre", collectionName, doc, context);
      return Collection.insertOne(doc).then(res => {
        console.log('---', res);
        return _.head(res.ops)
      });
      //didSave(type, response) if returns response //save again
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
