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

  test('lookup', () => {
    const data = () =>
      new AMDataResultPromise([{ _id: 'child-id', parentId: 'value' }]);
    const result = [
      { test: 'value', children: [{ _id: 'child-id', parentId: 'value' }] },
    ];

    const lookupResultPromise = resultPromise.lookup(
      'children',
      'test',
      'parentId',
      data
    );
    expect(lookupResultPromise.getValueSource()).toEqual(
      "Operation-0 -> lookup('children', 'test', 'parentId', AMResultPromise { Static Data })"
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
    let result = resultPromise.path('ids').dbRef('admins');
    expect(result.getValueSource()).toEqual(
      "Operation-0 -> path('ids') -> dbRef('admins')"
    );

    return expect(result).resolves.toEqual([
      new DBRef('admins', id1),
      new DBRef('admins', id2),
    ]);
  });

  test('single', () => {
    let result = resultPromise.path('id').dbRef('admins');
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
