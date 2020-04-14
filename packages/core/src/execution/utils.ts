import { AMModelType } from '../definitions';
import R from 'ramda';
import { AMContext } from './context';
import { AMOperation } from './operation';
import { AMResultPromise } from './resultPromise';
import { AMFieldsSelectionContext } from './contexts/fieldsSelection';
import { AMObjectFieldContext } from './contexts/objectField';
import { AMDataContext } from './contexts/data';
import { AMFragmentContext } from './contexts/fragment';
import { GraphQLNamedType } from 'graphql';

export const isOperation = (item: AMContext): item is AMOperation => {
  return item instanceof AMOperation;
};

export const getFieldsSelectionPathWithConditions = (
  stack: AMVisitorStack,
  operation: AMOperation
) => {
  const path = [];
  const conditions: Map<string, string> = new Map();
  const operationIndex = stack.indexOf(operation);
  for (let i = operationIndex + 1; i < stack.length; i++) {
    const ctx = stack[i];
    if (ctx instanceof AMFieldsSelectionContext) {
      path.push(R.last(ctx.fields));
    } else if (ctx instanceof AMFragmentContext) {
      path.pop();
      const conditionType = ctx.getActualConditionType() as AMModelType;
      if (conditionType) {
        conditions.set(path.join('.'), conditionType);
      }
    }
  }
  return {
    path: path.join('.'),
    pathArr: path,
    conditions,
  };
};
