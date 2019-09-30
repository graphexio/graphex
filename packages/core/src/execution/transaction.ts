import { AMOperation } from './operations/operation';

export class AMTransaction {
  operations: AMOperation[] = [];
  addOperation(operation: AMOperation) {
    this.operations.push(operation);
  }
}
