import { AMOperation } from './operation';

export class AMTransaction {
  operations: AMOperation[] = [];
  addOperation(operation: AMOperation) {
    this.operations.push(operation);
  }
}
