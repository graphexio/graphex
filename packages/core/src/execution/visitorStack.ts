import * as R from 'ramda';
import { AMContext } from './context';
import { AMOperation } from './operation';
import { isOperation } from './utils';
import { Path } from './path';
import {
  AMFieldsSelectionContext,
  AMObjectFieldContext,
  AMDataContext,
  AMFragmentContext,
} from './contexts';
import { TransformCondition } from './resultPromise/relationTransformation';

const displayItem = R.prop('display');
const dbItem = R.prop('db');

export class AMVisitorStack {
  private contexts: AMContext[] = [];
  private operationsInfo = new Map<
    AMOperation,
    { path: { display: string; db: string }[]; condition: TransformCondition }
  >();

  push(ctx: AMContext) {
    if (ctx instanceof AMOperation) {
      this.operationsInfo.set(ctx, { path: [], condition: new Map() });
    } else if (ctx instanceof AMFragmentContext) {
      const condType = ctx.getActualConditionType();
      if (condType) {
        for (const { path, condition } of this.operationsInfo.values()) {
          condition.set(path.map(displayItem).join('.'), condType);
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
          condition.delete(path.map(displayItem).join('.'));
        }
      }
    }
    return ctx;
  }

  enterPath(display: string, db: string) {
    for (const { path } of this.operationsInfo.values()) {
      path.push({ display, db });
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

  lastOperation(n = 0) {
    for (let i = this.contexts.length - 1; i >= 0; i--) {
      const ctx = this.contexts[i];
      if (isOperation(ctx)) {
        n = n - 1;
        if (n < 0) return ctx;
      }
    }
    return null;
  }

  rightIndexOf(item: AMContext) {
    for (let i = 0; i < this.contexts.length - 1; i++) {
      const ctx = this.contexts[this.contexts.length - 1 - i];
      if (ctx === item) return i;
    }
    return -1;
  }

  path(operation: AMOperation) {
    return Path.fromArray(
      this.operationsInfo.get(operation).path.map(displayItem)
    );
  }
  dbPath(operation: AMOperation) {
    return Path.fromArray(this.operationsInfo.get(operation).path.map(dbItem));
  }

  condition(operation: AMOperation) {
    return new Map(this.operationsInfo.get(operation).condition);
  }

  //TODO: Method is deprecated. Replace it with `path`
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
