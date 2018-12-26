import pluralize from 'pluralize';

export default db => async params => {
  var { type, collection, doc, selector, options } = params;
  // console.dir({ type, collection, selector, options }, { depth: null });
  let { skip, limit, sort } = options;

  console.log({ type, collection });
  console.dir(selector, { depth: null });

  let collectionName = pluralize(collection.toLowerCase());
  let Collection = db.collection(collectionName);

  switch (type) {
    case 'find': {
      let cursor = Collection.find(selector);
      if (limit) cursor = cursor.limit(limit);
      if (sort) cursor = cursor.sort(sort);
      return cursor.toArray();
    }
    case 'findOne': {
      return Collection.findOne(selector);
    }
    case 'count': {
      return Collection.find(selector).count();
    }
    case 'distinct': {
      let cursor = Collection.find(selector);
      if (limit) cursor = cursor.limit(limit);
      if (sort) cursor = cursor.sort(sort);
      return cursor.toArray().then(data => data.map(item => item[options.key]));
    }
    case 'insert': {
      return Collection.insertOne(doc).then(res => res.ops[0]);
    }
    case 'remove': {
      let d = await Collection.findOne(selector);
      await Collection.removeOne(selector);
      return d;
    }
    case 'update': {
      await Collection.update(selector, { $set: doc });
      return Collection.findOne(selector);
    }
  }
  return null;
};
