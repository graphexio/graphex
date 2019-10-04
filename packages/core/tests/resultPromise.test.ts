import { AMOperation } from '../src/execution/operation';
import { AMOperationResultPromise } from '../src/execution/resultPromise';
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

test('distinct', () => {
  const result = ['value'];
  const mapResultPromise = resultPromise.distinct('test');
  expect(mapResultPromise.getValueSource()).toEqual(
    `Operation-0 -> distinct('test')`
  );

  return expect(mapResultPromise).resolves.toEqual(result);
});
