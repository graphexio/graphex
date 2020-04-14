import * as R from 'ramda';
import { AMContext } from './context';
import { AMOperation } from './operation';
import { isOperation } from './utils';
import {
  AMFieldsSelectionContext,
  AMObjectFieldContext,
  AMDataContext,
  AMFragmentContext,
} from './contexts';
import { TransformCondition } from './resultPromise/relationTransformation';

export class AMVisitorStack {
  private contexts: AMContext[] = [];
  private operationsInfo = new Map<
    AMOperation,
    { path: string[]; condition: TransformCondition }
  >();

  push(ctx: AMContext) {
    if (ctx instanceof AMOperation) {
      this.operationsInfo.set(ctx, { path: [], condition: new Map() });
    } else if (ctx instanceof AMFragmentContext) {
      const condType = ctx.getActualConditionType();
      if (condType) {
        for (const { path, condition } of this.operationsInfo.values()) {
          condition.set(path.join('.'), condType);
        }
      }
    }
    return this.contexts.push(ctx);
  }

  pop() {
    const ctx = this.contexts.pop();
    if (ctx instanceof AMOperation) {
      this.operationsInfo.delete(ctx);
    } else if (ctx instanceof AMFragmentContext) {
      const condType = ctx.getActualConditionType();
      if (condType) {
        for (const { path, condition } of this.operationsInfo.values()) {
          condition.delete(path.join('.'));
        }
      }
    }
    return ctx;
  }

  enterPath(pathItem: string) {
    for (const { path } of this.operationsInfo.values()) {
      path.push(pathItem);
    }
  }

  leavePath() {
    for (const { path } of this.operationsInfo.values()) {
      path.pop();
    }
  }

  last(drop = 0) {
    return this.contexts[this.contexts.length - 1 - drop];
  }

  lastOperation() {
    return R.findLast(isOperation, this.contexts) as AMOperation;
  }

  path(operation: AMOperation) {
    return [...this.operationsInfo.get(operation).path];
  }

  condition(operation: AMOperation) {
    return new Map(this.operationsInfo.get(operation).condition);
  }

  getFieldPath(operation: AMOperation) {
    const path = [];
    const operationIndex = this.contexts.indexOf(operation);
    for (let i = operationIndex + 1; i < this.contexts.length; i++) {
      const ctx = this.contexts[i];
      if (ctx instanceof AMFieldsSelectionContext) {
        path.push(R.last(ctx.fields));
      } else if (ctx instanceof AMObjectFieldContext) {
        path.push(ctx.fieldName);
      }
    }
    return path.join('.');
  }

  getOperationData(operation: AMOperation): AMDataContext {
    const operationIndex = this.contexts.indexOf(operation);
    for (let i = operationIndex + 1; i < this.contexts.length; i++) {
      const ctx = this.contexts[i];
      if (ctx instanceof AMDataContext) {
        return ctx;
      }
    }
  }
}
