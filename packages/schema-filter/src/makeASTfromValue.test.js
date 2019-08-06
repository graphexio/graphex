import { Kind } from 'graphql';

import makeASTfromValue from './makeASTfromValue';

test('makeASTfromValue String', () => {
  let value = 'VALUE';
  expect(makeASTfromValue(value)).toEqual({
    kind: Kind.STRING,
    value: value,
  });
});

test('makeASTfromValue Int', () => {
  let value = 1;
  expect(makeASTfromValue(value)).toEqual({
    kind: Kind.INT,
    value: value,
  });
});

test('makeASTfromValue Float', () => {
  let value = 1.1;
  expect(makeASTfromValue(value)).toEqual({
    kind: Kind.FLOAT,
    value: value,
  });
});

test('makeASTfromValue Array', () => {
  let value = [1, 2];
  expect(makeASTfromValue(value)).toEqual({
    kind: Kind.LIST,
    values: value.map(makeASTfromValue),
  });
});

test('makeASTfromValue Object', () => {
  let value = { field1: 'VALUE1', field2: 'VALUE2' };

  expect(makeASTfromValue(value)).toEqual({
    kind: Kind.OBJECT,
    fields: [
      {
        kind: Kind.OBJECT_FIELD,
        name: { kind: Kind.NAME, value: 'field1' },
        value: makeASTfromValue(value['field1']),
      },
      {
        kind: Kind.OBJECT_FIELD,
        name: { kind: Kind.NAME, value: 'field2' },
        value: makeASTfromValue(value['field2']),
      },
    ],
  });
});
