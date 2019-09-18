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

import { modelDefaultActions, modelField } from './';

import * as INPUT_KINDS from '@apollo-model/core/lib/inputTypes/kinds.js';
import { getInputTypeName } from '@apollo-model/core/lib/inputTypes/';

test.each([
  ['C', [false, false, false, false, true, false, false, false]],
  ['R', [true, true, true, true, false, false, false, false]],
  ['U', [false, false, false, false, false, false, false, true]],
  ['D', [false, false, false, false, false, true, true, false]],
])('modelAccess %s', (permission, resultmask) => {
  let modelName = 'Brand';
  let rule = modelDefaultActions(modelName, permission);

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
      rule({
        type: { name: getOperationName(kind) },
        field: { name: getMethodName(kind, modelName) },
      })
    ).toBe(resultmask[i]);
  });
});

test('fieldAccessRule', () => {
  let modelName = 'Brand';
  let fieldName = 'name';
  let rule = modelField(modelName, fieldName, 'R');

  expect(rule({ type: { name: modelName }, field: { name: fieldName } })).toBe(
    true
  );
});

test('fieldAccessRule Wildcard', () => {
  let rule = modelField('.*', '.*', 'R');

  expect(
    rule({ type: { name: 'modelName' }, field: { name: 'fieldName' } })
  ).toBe(true);
  expect(rule({ type: { name: 'Query' }, field: { name: 'fieldName' } })).toBe(
    false
  );
  expect(
    rule({ type: { name: 'Mutation' }, field: { name: 'fieldName' } })
  ).toBe(false);
  expect(
    rule({ type: { name: 'Subscription' }, field: { name: 'fieldName' } })
  ).toBe(false);
});
