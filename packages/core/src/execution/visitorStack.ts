import * as R from 'ramda';
import { AMContext } from './context';
import { AMOperation } from './operation';
import { isOperation } from './utils';
import { Path } from './path';
import {
  AMFieldsSelectionContext,
  AMObjectFieldContext,
  AMDataContext,
} from './contexts';
import { AMInputField, AMModelField } from '../definitions';

const displayItem = R.prop('display');
const dbItem = R.prop('db');

type PathNode = {
  display: string;
  db: string;
  field?: AMModelField | AMInputField;
};

export class AMVisitorStack {
  private contexts: AMContext[] = [];
  private pathNodes: PathNode[] = [];
  private operationsInfo = new Map<
    AMOperation,
    {
      path: PathNode[];
    }
  >();

  push(ctx: AMContext) {
    if (ctx instanceof AMOperation) {
      this.operationsInfo.set(ctx, { path: [] });
    }
    return this.contexts.push(ctx);
  }

  pop() {
    const ctx = this.contexts.pop();
    if (ctx instanceof AMOperation) {
      this.operationsInfo.delete(ctx);
    }
    return ctx;
  }

  enterPath(node: PathNode) {
    for (const { path } of this.operationsInfo.values()) {
      path.push(node);
    }
    this.pathNodes.push(node);
  }

  leavePath() {
    for (const { path } of this.operationsInfo.values()) {
      path.pop();
    }
    this.pathNodes.pop();
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

  lastPathNode(drop = 0) {
    return this.pathNodes[this.pathNodes.length - 1 - drop];
  }

  /**
   * @deprecated Replace with path
   */
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

  /**
   *
   * @deprecated
   */
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
