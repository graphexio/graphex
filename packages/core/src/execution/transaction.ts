import { AMOperation } from './operation';
import { AMDBExecutor } from '../types';

export class AMTransaction {
  operations: AMOperation[] = [];
  addOperation(operation: AMOperation) {
    this.operations.push(operation);
  }

  execute(executor: AMDBExecutor) {
    if (this.operations.length > 0) {
      return this.operations[0].execute(executor);
    }
    throw new Error('Empty transaction');
  }
}
