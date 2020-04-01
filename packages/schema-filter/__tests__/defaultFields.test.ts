import DefaultFields from '../src/defaultFields';

test('defaultFields', () => {
  const defaults = DefaultFields();
  defaults.add({ name: 'TypeName' }, { name: 'Field1' }, () => 'valueA');
  defaults.add({ name: 'TypeName' }, { name: 'Field2' }, () => 'valueB');

  expect(defaults.get({ name: 'TypeName' })).toEqual({
    Field1: 'valueA',
    Field2: 'valueB',
  });

  expect(defaults.get({ name: 'UnknowneName' })).toEqual(undefined);
});
