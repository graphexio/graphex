import { AMVisitorStack } from '../types';
import R from 'ramda';
import { AMContext } from './context';
import { AMOperation } from './operation';
import { AMResultPromise } from './resultPromise';
import { AMFieldsSelectionContext } from './contexts/fieldsSelection';
import { AMObjectFieldContext } from './contexts/objectField';
import { AMDataContext } from './contexts/data';

const isOperation = (item: AMContext): item is AMOperation => {
  return item instanceof AMOperation;
};

export const getLastOperation = (stack: AMVisitorStack): AMOperation => {
  return R.findLast(isOperation, stack) as AMOperation;
};

export const getOperationData = (
  stack: AMVisitorStack,
  operation: AMOperation
): AMDataContext => {
  const operationIndex = stack.indexOf(operation);
  for (let i = operationIndex + 1; i < stack.length; i++) {
    const ctx = stack[i];
    if (ctx instanceof AMDataContext) {
      return ctx;
    }
  }
};

export const getFieldPath = (stack: AMVisitorStack, operation: AMOperation) => {
  const path = [];
  const operationIndex = stack.indexOf(operation);
  for (let i = operationIndex + 1; i < stack.length; i++) {
    const ctx = stack[i];
    if (ctx instanceof AMFieldsSelectionContext) {
      path.push(R.last(ctx.fields));
    } else if (ctx instanceof AMObjectFieldContext) {
      path.push(ctx.fieldName);
    }
  }
  return path.join('.');
};

export const getFieldsSelectionPath = (
  stack: AMVisitorStack,
  operation: AMOperation
) => {
  const path = [];
  const operationIndex = stack.indexOf(operation);
  for (let i = operationIndex + 1; i < stack.length; i++) {
    const ctx = stack[i];
    if (ctx instanceof AMFieldsSelectionContext) {
      path.push(R.last(ctx.fields));
    }
  }
  return path.join('.');
};

export async function completeAMResultPromise(obj: any) {
  if (obj instanceof AMResultPromise) {
    return await obj.getPromise();
  } else if (obj && obj.constructor && obj.constructor.name == 'Object') {
    return Object.fromEntries(
      await Promise.all(
        Object.entries(obj).map(async ([k, v]) => {
          return [k, await completeAMResultPromise(v)];
        })
      )
    );
  } else if (obj && obj.constructor && obj.constructor.name == 'Array') {
    return await Promise.all(
      obj.map(v => {
        return completeAMResultPromise(v);
      })
    );
  } else {
    return obj;
  }
}
