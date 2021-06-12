import { reduceSelector } from '../src/reduceSelector';
import { SelectorOperators } from '@graphex/abstract-datasource-adapter';

test('Reduce object without operations to the same object', () => {
  expect(
    reduceSelector({ testField1: 'value1', testField2: 'value2' })
  ).toEqual({ testField1: 'value1', testField2: 'value2' });
});

test('Reduce AND to $and', () => {
  expect(
    reduceSelector({
      [SelectorOperators.AND]: [
        { testField1: 'value1' },
        { testField2: 'value2' },
      ],
    })
  ).toEqual({ $and: [{ testField1: 'value1' }, { testField2: 'value2' }] });
});

test('Reduce OR to $or', () => {
  expect(
    reduceSelector({
      [SelectorOperators.OR]: [
        { testField1: 'value1' },
        { testField2: 'value2' },
      ],
    })
  ).toEqual({ $or: [{ testField1: 'value1' }, { testField2: 'value2' }] });
});

test('Reduce OR to $or', () => {
  expect(
    reduceSelector({
      [SelectorOperators.OR]: [
        { testField1: 'value1' },
        { testField2: 'value2' },
      ],
    })
  ).toEqual({ $or: [{ testField1: 'value1' }, { testField2: 'value2' }] });
});

test('Reduce GT', () => {
  expect(
    reduceSelector({ testField1: { [SelectorOperators.GT]: 1 } })
  ).toEqual({ testField1: { $gt: 1 } });
});
