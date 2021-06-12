import { STARTS_WITH, CONTAINS, AND, OR } from '../src/selector';
import { createSelectorReducer } from '../';

const createMockReducer = () => {
  const toChunk = jest.fn((key, value) => `${key} = '${value}'`);
  const andToChunk = jest.fn(chunks => `(${chunks.join(' AND ')})`);
  const orToChunk = jest.fn(chunks => `(${chunks.join(' OR ')})`);
  const mergeChunks = jest.fn(chunks => chunks.join(' AND '));
  const operatorToChunk = {
    [CONTAINS]: jest.fn((key, value) => `${key} LIKE '%${value}%'`),
  };

  const reducer = createSelectorReducer<string>({
    toChunk,
    andToChunk,
    orToChunk,
    mergeChunks,
    operatorToChunk,
  });

  return {
    toChunk,
    andToChunk,
    orToChunk,
    mergeChunks,
    operatorToChunk,
    reducer,
  };
};

test('toChunk should be called', () => {
  const { reducer, toChunk } = createMockReducer();

  expect(reducer({ title: 'test' })).toEqual("title = 'test'");

  expect(toChunk.mock.calls.length).toBe(1);
  expect(toChunk.mock.calls[0][0]).toBe('title');
  expect(toChunk.mock.calls[0][1]).toBe('test');
});

test('andToChunk should be called', () => {
  const { reducer, andToChunk } = createMockReducer();

  expect(
    reducer({ [AND]: [{ title: 'test' }, { category: 'test-category' }] })
  ).toEqual("(title = 'test' AND category = 'test-category')");

  expect(andToChunk.mock.calls.length).toBe(1);
  expect(andToChunk.mock.calls[0][0]).toEqual([
    "title = 'test'",
    "category = 'test-category'",
  ]);
});

test('orToChunk should be called', () => {
  const { reducer, orToChunk } = createMockReducer();

  expect(
    reducer({ [OR]: [{ title: 'test' }, { category: 'test-category' }] })
  ).toEqual("(title = 'test' OR category = 'test-category')");

  expect(orToChunk.mock.calls.length).toBe(1);
  expect(orToChunk.mock.calls[0][0]).toEqual([
    "title = 'test'",
    "category = 'test-category'",
  ]);
});

test('operator should be called', () => {
  const { reducer, operatorToChunk } = createMockReducer();

  expect(reducer({ title: { [CONTAINS]: 'test' } })).toEqual(
    "title LIKE '%test%'"
  );

  expect(operatorToChunk[CONTAINS].mock.calls.length).toBe(1);
  expect(operatorToChunk[CONTAINS].mock.calls[0][0]).toEqual('title');
  expect(operatorToChunk[CONTAINS].mock.calls[0][1]).toEqual('test');
});

test('error should be trown for unsupported operator', () => {
  const { reducer } = createMockReducer();

  expect(() => reducer({ title: { [STARTS_WITH]: 'test' } })).toThrowError(
    'Unsupported operator startsWith'
  );
});

test('mergeChunks should be called', () => {
  const { reducer, mergeChunks } = createMockReducer();

  expect(reducer({ title: 'test', category: 'test-category' })).toEqual(
    "title = 'test' AND category = 'test-category'"
  );

  expect(mergeChunks.mock.calls.length).toBe(1);
  expect(mergeChunks.mock.calls[0][0]).toEqual([
    "title = 'test'",
    "category = 'test-category'",
  ]);
});
