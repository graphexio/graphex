import { AMOperation } from '../src/execution/operation';
import {
  AMOperationResultPromise,
  AMDataResultPromise,
} from '../src/execution/resultPromise';
import { AMTransaction } from '../src/execution/transaction';

const arr = [{ test: 'value' }];
const transaction = new AMTransaction();
const operation = new AMOperation(transaction, { collectionName: '' });
const resultPromise = new AMOperationResultPromise<any>(operation);
resultPromise.resolve(arr);

test('simple', () => {
  expect(resultPromise.getValueSource()).toMatchInlineSnapshot(`"Operation-0"`);
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
