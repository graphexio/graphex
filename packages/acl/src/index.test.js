import {
  SINGLE_QUERY,
  MULTIPLE_QUERY,
  CONNECTION_QUERY,
  MULTIPLE_PAGINATION_QUERY,
  CREATE_MUTATION,
  DELETE_MUTATION,
  DELETE_MANY_MUTATION,
  UPDATE_MUTATION,
  getMethodName,
  getOperationName,
} from '@apollo-model/core/lib/methodKinds.js';

import { modelAccessRule, fieldAccessRule } from './';

import * as INPUT_KINDS from '@apollo-model/core/lib/inputTypes/kinds.js';
import { getInputTypeName } from '@apollo-model/core/lib/inputTypes/';

test.each([
  ['C', [false, false, false, false, true, false, false, false]],
  ['R', [true, true, true, true, false, false, false, false]],
  ['U', [false, false, false, false, false, false, false, true]],
  ['D', [false, false, false, false, false, true, true, false]],
])('modelAccess %s', (permission, resultmask) => {
  let modelName = 'Brand';
  let rule = modelAccessRule(modelName, permission);

  [
    SINGLE_QUERY,
    MULTIPLE_QUERY,
    CONNECTION_QUERY,
    MULTIPLE_PAGINATION_QUERY,
    CREATE_MUTATION,
    DELETE_MUTATION,
    DELETE_MANY_MUTATION,
    UPDATE_MUTATION,
  ].forEach((kind, i) => {
    expect(
      rule([
        { name: getOperationName(kind) },
        { name: getMethodName(kind, modelName) },
      ])
    ).toBe(resultmask[i]);
  });
});

test('fieldAccessRule', () => {
  let modelName = 'Brand';
  let fieldName = 'name';
  let rule = fieldAccessRule(modelName, fieldName, 'R');

  expect(rule([{ name: modelName }, { name: fieldName }])).toBe(true);

  console.log('test');
});

test('fieldAccessRule Wildcard', () => {
  let rule = fieldAccessRule('.*', '.*', 'R');

  expect(rule([{ name: 'modelName' }, { name: 'fieldName' }])).toBe(true);
  expect(rule([{ name: 'Query' }, { name: 'fieldName' }])).toBe(false);
  expect(rule([{ name: 'Mutation' }, { name: 'fieldName' }])).toBe(false);
  expect(rule([{ name: 'Subscription' }, { name: 'fieldName' }])).toBe(false);

  console.log('test');
});
