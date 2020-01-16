import { modelField } from '../src';

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
