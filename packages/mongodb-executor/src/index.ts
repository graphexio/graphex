import DataLoader from 'dataloader';
import _, { curry } from 'lodash';
import ObjectHash from 'object-hash';
import { Db } from 'mongodb';
import { assocPath, head } from 'ramda';

export enum AMDBExecutorOperationType {
  FIND = 'find',
  FIND_ONE = 'findOne',
  FIND_IDS = 'findIds',
  AGGREGATE = 'aggregate',
  DISTINCT = 'distinct',
  INSERT_ONE = 'insertOne',
  INSERT_MANY = 'insertMany',
  DELETE_ONE = 'deleteOne',
  DELETE_MANY = 'deleteMany',
  UPDATE_ONE = 'updateOne',
  UPDATE_MANY = 'updateMany',
}

const dataLoaders = {};

const getDataLoader = (db, collectionName, selectorField, selector = {}) => {
  const key = ObjectHash({ collectionName, selectorField, selector });
  if (!dataLoaders[key]) {
    const Collection = db.collection(collectionName);
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

const queryExecutor = DB => async (params: {
  type: AMDBExecutorOperationType;
  selector?: any;
  collection: string;
  fields?: string[];
  doc?: any;
  docs?: any[];
  options?: {
    skip?: number;
    limit?: number;
    sort?: any;
    arrayFilters?: any;
    selectorField?: any;
    ids?: any;
    key?: any;
  };
}) => {
  const db: Db = _.isFunction(DB) ? await DB(params) : await DB;

  const {
    type,
    collection: collectionName,
    doc,
    docs,
    options,
    fields = [],
  } = params;
  let { selector } = params;
  const { skip, limit, sort, arrayFilters = [] } = options ?? {};

  const Collection = db.collection(collectionName);

  switch (type) {
    case AMDBExecutorOperationType.FIND: {
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
    case AMDBExecutorOperationType.FIND_ONE: {
      return Collection.findOne(selector);
    }
    case AMDBExecutorOperationType.FIND_IDS: {
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
    case AMDBExecutorOperationType.AGGREGATE: {
      /**
       * If request contains only count then we can improve performance with simple query
       */
      if (fields.length === 1 && fields[0] === 'aggregate.count') {
        let cursor = Collection.find(selector);
        if (skip) cursor = cursor.skip(skip);
        if (limit) cursor = cursor.limit(limit);
        if (sort) cursor = cursor.sort(sort);
        return { aggregate: { count: await cursor.count(true) } };
      } else {
        const pipeline = [];

        if (selector) {
          pipeline.push({ $match: selector });
        }
        if (skip) {
          pipeline.push({ $skip: skip });
        }
        if (limit) {
          pipeline.push({ $limit: limit });
        }

        const group = { _id: null };
        const backMap = [];

        fields.forEach((field, i) => {
          const path = field.split('.');
          path.shift();
          const op = path.shift();
          if (!['min', 'max', 'sum'].includes(op)) {
            throw new Error('unsupported opperation');
          }
          const aggregationField = `f${i}`;
          group[aggregationField] = { [`$${op}`]: `$${path.join('.')}` };
          backMap.push({ path: [op, ...path], field: aggregationField });
        });
        pipeline.push({ $group: group });

        const aggregationResult = head(
          await Collection.aggregate(pipeline).toArray()
        );
        if (!aggregationResult) {
          return { aggregate: { count: 0, min: null, max: null, sum: null } };
        }
        const aggregate = backMap.reduce((acc, { field, path }) => {
          return assocPath(path, aggregationResult[field], acc);
        }, {});

        return { aggregate };
      }
    }
    case AMDBExecutorOperationType.DISTINCT: {
      let cursor = Collection.find(selector);
      if (skip) cursor = cursor.skip(skip);
      if (limit) cursor = cursor.limit(limit);
      if (sort) cursor = cursor.sort(sort);
      return cursor.toArray().then(data => data.map(item => item[options.key]));
    }
    case AMDBExecutorOperationType.INSERT_ONE: {
      return Collection.insertOne(doc).then(res => _.head(res.ops));
    }
    case AMDBExecutorOperationType.INSERT_MANY: {
      return Collection.insertMany(docs).then(res => res.ops);
    }

    case AMDBExecutorOperationType.DELETE_MANY: {
      return Collection.deleteMany(selector).then(res => res.deletedCount);
    }

    case AMDBExecutorOperationType.DELETE_ONE: {
      return Collection.findOneAndDelete(selector).then(res => res.value);
    }
    case AMDBExecutorOperationType.UPDATE_MANY: {
      return Collection.updateMany(selector, docs, { arrayFilters }).then(
        res => res.modifiedCount
      );
    }
    case AMDBExecutorOperationType.UPDATE_ONE: {
      return Collection.findOneAndUpdate(selector, doc, {
        returnOriginal: false,
        arrayFilters,
      }).then(res => res.value);
    }
  }
  return null;
};
export default queryExecutor;
