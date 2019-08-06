import { mapFieldForTypeStack, groupFields } from './';

test('mapFieldForTypeStack', () => {
  let input = {
    type: 'type',
    args: [
      {
        name: 'arg1',
        type: 'arg1type',
      },
      {
        name: 'arg2',
        type: 'arg2type',
      },
    ],
  };

  let output = {
    type: input.type,
    args: {
      arg1: input.args[0],
      arg2: input.args[1],
    },
  };

  expect(mapFieldForTypeStack(input)).toEqual(output);
});

test('groupFields', () => {
  const isEven = n => n % 2 === 0;

  expect(groupFields(isEven, { a: 1, b: 2, c: 3, d: 4 })).toEqual({
    false: { a: 1, c: 3 },
    true: { b: 2, d: 4 },
  });
});
