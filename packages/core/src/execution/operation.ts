import { AMContext } from './context';
import { AMFieldsSelectionContext } from './contexts/fieldsSelection';
import { AMSelectorContext } from './contexts/selector';
import { AMDBExecutor } from '../types';
import { AMResultPromise } from './resultPromise';
import { AMTransaction } from './transaction';

export class AMOperation extends AMContext {
  collectionName: string;
  fieldsSelection: AMFieldsSelectionContext;
  selector: AMSelectorContext;
  _result: AMResultPromise<any>;
  _transactionNumber: number;
  _output: AMResultPromise<any>;

  constructor(
    transaction: AMTransaction,
    config: {
      collectionName: string;
      selector?: AMSelectorContext;
      fieldsSelection?: AMFieldsSelectionContext;
    }
  ) {
    super();
    this.collectionName = config.collectionName;
    this.selector = config.selector;
    this.fieldsSelection = config.fieldsSelection;

    this._result = new AMResultPromise(this);
    this._transactionNumber = transaction.operations.length;
    transaction.addOperation(this);
  }

  getIdentifier() {
    return `Operation-${this._transactionNumber}`;
  }

  setFieldsSelection(selectionSet: AMFieldsSelectionContext) {
    this.fieldsSelection = selectionSet;
  }

  setSelector(selector: AMSelectorContext) {
    this.selector = selector;
  }

  execute(executor: AMDBExecutor) {}

  getResult() {
    return this._result;
  }

  getOutput() {
    if (this._output) {
      return this._output;
    } else {
      return this._result;
    }
  }

  setOutput(output: AMResultPromise<any>) {
    this._output = output;
  }

  toJSON() {
    return {
      identifier: this.getIdentifier(),
      kind: this.constructor.name,
      collectionName: this.collectionName,
      fieldsSelection: this.fieldsSelection
        ? this.fieldsSelection.toJSON()
        : undefined,
      selector: this.selector ? this.selector.toJSON() : undefined,
      output: this.getOutput(),
    };
  }
}
