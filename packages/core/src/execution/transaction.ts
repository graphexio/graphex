import { AMOperation } from './operation';
import { DataSourceAdapter } from '@graphex/abstract-datasource-adapter';

export class AMTransaction {
  constructor(public fieldsRegistry: Map<any, any>) {}

  operations: AMOperation[] = [];
  addOperation(operation: AMOperation) {
    this.operations.push(operation);
  }

  execute(adapter: DataSourceAdapter) {
    if (this.operations.length > 0) {
      this.operations.forEach(op => op.execute(adapter));
      return this.operations[0].getOutput();
    }
    throw new Error('Empty transaction');
  }

  toJSON() {
    return { operations: this.operations.map(op => op.toJSON()) };
  }
}
