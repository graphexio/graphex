import { AMVisitorStack, AMModelType } from '../definitions';
import R from 'ramda';
import { AMContext } from './context';
import { AMOperation } from './operation';
import { AMResultPromise } from './resultPromise';
import { AMFieldsSelectionContext } from './contexts/fieldsSelection';
import { AMObjectFieldContext } from './contexts/objectField';
import { AMDataContext } from './contexts/data';
import { AMFragmentContext } from './contexts/fragment';
import { GraphQLNamedType } from 'graphql';

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
    } else if (ctx instanceof AMFragmentContext) {
      path.pop();
    }
  }
  return path.join('.');
};

export const getFieldsSelectionPathWithConditions = (
  stack: AMVisitorStack,
  operation: AMOperation
) => {
  const path = [];
  let conditions: Map<string, string>;
  const operationIndex = stack.indexOf(operation);
  for (let i = operationIndex + 1; i < stack.length; i++) {
    const ctx = stack[i];
    if (ctx instanceof AMFieldsSelectionContext) {
      path.push(R.last(ctx.fields));
    } else if (ctx instanceof AMFragmentContext) {
      path.pop();
      const conditionType = ctx.getActualConditionType() as AMModelType;
      if (conditionType) {
        if (!conditions) {
          conditions = new Map();
        }
        conditions.set(
          [...path, conditionType.mmDiscriminatorField].join('.'),
          conditionType.mmDiscriminator
        );
      }
    }
  }
  return {
    path: path.join('.'),
    pathArr: path,
    conditions,
  };
};
