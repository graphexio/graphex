import { AMOperation } from '../src/execution/operation';
import {
  AMOperationResultPromise,
  AMDataResultPromise,
} from '../src/execution/resultPromise';
import { AMTransaction } from '../src/execution/transaction';
import { ObjectID, DBRef } from 'mongodb';

describe('simple', () => {
  const arr = [{ test: 'value' }];
  const transaction = new AMTransaction();
  const operation = new AMOperation(transaction, { collectionName: '' });
  const resultPromise = new AMOperationResultPromise<any>(operation);
  resultPromise.resolve(arr);

  test('simple', () => {
    expect(resultPromise.getValueSource()).toMatchInlineSnapshot(
      `"Operation-0"`
    );
    return expect(resultPromise).resolves.toEqual(arr);
  });

  test('data', () => {
    const dataPromise = new AMDataResultPromise({ data: 'test-value' });
    expect(dataPromise.getValueSource()).toEqual(`Static Data`);
  });

  test('distinct', () => {
    const result = ['value'];
    const distinctResultPromise = resultPromise.distinct('test');
    expect(distinctResultPromise.getValueSource()).toEqual(
      `Operation-0 -> distinct('test')`
    );

    return expect(distinctResultPromise).resolves.toEqual(result);
  });

  test('distinctReplace', () => {
    const data = () => new AMDataResultPromise([{ _id: 'value' }]);
    const result = [{ test: { _id: 'value' } }];

    const distinctReplaceResultPromise = resultPromise.distinctReplace(
      'test',
      '_id',
      data
    );
    expect(distinctReplaceResultPromise.getValueSource()).toEqual(
      "Operation-0 -> distinctReplace('test', '_id', AMResultPromise { Static Data })"
    );

    return expect(distinctReplaceResultPromise).resolves.toEqual(result);
  });
});

describe('lookup', () => {
  test('lookup', () => {
    const arr = [{ id: 'item-id' }];
    const transaction = new AMTransaction();
    const operation = new AMOperation(transaction, { collectionName: '' });
    const resultPromise = new AMOperationResultPromise<any>(operation);
    resultPromise.resolve(arr);

    const data = () =>
      new AMDataResultPromise([{ _id: 'child-id', parentId: 'item-id' }]);
    const result = [
      { id: 'item-id', children: [{ _id: 'child-id', parentId: 'item-id' }] },
    ];

    const lookupResultPromise = resultPromise.lookup(
      'children',
      'id',
      'parentId',
      data
    );
    expect(lookupResultPromise.getValueSource()).toEqual(
      "Operation-0 -> lookup('children', 'id', 'parentId', AMResultPromise { Static Data }, true)"
    );

    return expect(lookupResultPromise).resolves.toEqual(result);
  });

  test('lookup single', () => {
    const arr = [{ id: 'item-id' }];
    const transaction = new AMTransaction();
    const operation = new AMOperation(transaction, { collectionName: '' });
    const resultPromise = new AMOperationResultPromise<any>(operation);
    resultPromise.resolve(arr);

    const data = () =>
      new AMDataResultPromise([{ _id: 'child-id', parentId: 'item-id' }]);
    const result = [
      { id: 'item-id', children: { _id: 'child-id', parentId: 'item-id' } },
    ];

    const lookupResultPromise = resultPromise.lookup(
      'children',
      'id',
      'parentId',
      data,
      false
    );
    expect(lookupResultPromise.getValueSource()).toEqual(
      "Operation-0 -> lookup('children', 'id', 'parentId', AMResultPromise { Static Data }, false)"
    );

    return expect(lookupResultPromise).resolves.toEqual(result);
  });

  test('lookup inside nested', () => {
    const arr = [{ id: 'item-id', nested: { id: 'nested-item-id' } }];
    const transaction = new AMTransaction();
    const operation = new AMOperation(transaction, { collectionName: '' });
    const resultPromise = new AMOperationResultPromise<any>(operation);
    resultPromise.resolve(arr);

    const data = () =>
      new AMDataResultPromise([
        { _id: 'child-id', parentId: 'nested-item-id' },
      ]);
    const result = [
      {
        id: 'item-id',
        nested: {
          id: 'nested-item-id',
          children: { _id: 'child-id', parentId: 'nested-item-id' },
        },
      },
    ];

    const lookupResultPromise = resultPromise.lookup(
      'nested.children',
      'id',
      'parentId',
      data,
      false
    );
    expect(lookupResultPromise.getValueSource()).toEqual(
      "Operation-0 -> lookup('nested.children', 'id', 'parentId', AMResultPromise { Static Data }, false)"
    );

    return expect(lookupResultPromise).resolves.toEqual(result);
  });
});

describe('dbRef', () => {
  const id1 = new ObjectID();
  const id2 = new ObjectID();
  const arr = { ids: [id1, id2], id: id1 };

  const transaction = new AMTransaction();
  const operation = new AMOperation(transaction, { collectionName: '' });
  const resultPromise = new AMOperationResultPromise<any>(operation);
  resultPromise.resolve(arr);

  test('many', () => {
    const result = resultPromise.path('ids').dbRef('admins');
    expect(result.getValueSource()).toEqual(
      "Operation-0 -> path('ids') -> dbRef('admins')"
    );

    return expect(result).resolves.toEqual([
      new DBRef('admins', id1),
      new DBRef('admins', id2),
    ]);
  });

  test('single', () => {
    const result = resultPromise.path('id').dbRef('admins');
    expect(result.getValueSource()).toEqual(
      "Operation-0 -> path('id') -> dbRef('admins')"
    );

    return expect(result).resolves.toEqual(new DBRef('admins', id1));
  });
});

test('dbRef replace', () => {
  const id1 = new ObjectID();
  const id2 = new ObjectID();
  const id3 = new ObjectID();
  const collection1 = 'admins';
  const collection2 = 'customers';

  const obj1 = {
    _id: id1,
    mmCollectionName: collection1,
  };
  const obj2 = {
    _id: id2,
    mmCollectionName: collection1,
  };
  const obj3 = {
    _id: id3,
    mmCollectionName: collection2,
  };

  const doc = {
    ids: [
      new DBRef(collection1, id1),
      new DBRef(collection1, id2),
      new DBRef(collection2, id3),
    ],
  };

  const transaction = new AMTransaction();
  const operation = new AMOperation(transaction, { collectionName: '' });
  const resultPromise = new AMOperationResultPromise<any>(operation);
  resultPromise.resolve(doc);

  const data = () =>
    new AMDataResultPromise({
      [collection1]: {
        [id1.toHexString()]: obj1,
        [id2.toHexString()]: obj2,
      },
      [collection2]: {
        [id3.toHexString()]: obj3,
      },
    });

  const result = resultPromise.dbRefReplace('ids', data);

  expect(result.getValueSource()).toEqual(
    "Operation-0 -> dbRefReplace('ids', AMResultPromise { Static Data })"
  );

  return expect(result).resolves.toEqual({
    ids: [obj1, obj2, obj3],
  });
});
