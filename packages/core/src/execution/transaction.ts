import { AMOperation } from './operation';
import { AMDBExecutor } from '../definitions';

export class AMTransaction {
  operations: AMOperation[] = [];
  addOperation(operation: AMOperation) {
    this.operations.push(operation);
  }

  execute(executor: AMDBExecutor) {
    if (this.operations.length > 0) {
      this.operations.forEach(op => op.execute(executor));
      return this.operations[0].getOutput();
    }
    throw new Error('Empty transaction');
  }

  toJSON() {
    return { operations: this.operations.map(op => op.toJSON()) };
  }
}
