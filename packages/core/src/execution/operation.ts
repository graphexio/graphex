import { AMContext } from './context';
import { AMFieldsSelectionContext } from './contexts/fieldsSelection';
import { AMSelectorContext } from './contexts/selector';
import { AMDBExecutor } from '../types';
import { AMResultPromise } from './resultPromise';
import { AMTransaction } from './transaction';
import { AMDataContext } from './contexts/data';
import { AMListValueContext } from './contexts/listValue';
import { DBRef } from 'mongodb';

export class AMOperation extends AMContext {
  collectionName: string;
  fieldsSelection: AMFieldsSelectionContext;
  selector: AMSelectorContext;
  data: AMDataContext;
  dataList: AMListValueContext;
  dbRef: DBRef | AMResultPromise<DBRef>;
  dbRefList: DBRef[] | AMResultPromise<DBRef[]> | AMResultPromise<DBRef>[];
  many: boolean;
  orderBy: { [key: string]: number };

  _result: AMResultPromise<any>;
  _transactionNumber: number;
  _output: AMResultPromise<any>;

  constructor(
    transaction: AMTransaction,
    config: {
      collectionName?: string;
      selector?: AMSelectorContext;
      fieldsSelection?: AMFieldsSelectionContext;
      data?: AMDataContext;
      dataList?: AMListValueContext;
      dbRef?: DBRef | AMResultPromise<DBRef>;
      dbRefList?: DBRef[] | AMResultPromise<DBRef[]> | AMResultPromise<DBRef>[];
      many?: boolean;
      orderBy?: { [key: string]: number };
    }
  ) {
    super();
    this.collectionName = config.collectionName;
    this.selector = config.selector;
    this.fieldsSelection = config.fieldsSelection;
    this.data = config.data;
    this.dataList = config.dataList;
    this.dbRef = config.dbRef;
    this.dbRefList = config.dbRefList;
    this.many = Boolean(config.many);
    this.orderBy = config.orderBy;

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

  setData(data: AMDataContext) {
    this.data = data;
  }

  setDataList(dataList: AMListValueContext) {
    this.dataList = dataList;
  }

  setDbRef(dbRef: DBRef) {
    this.dbRef = dbRef;
  }

  setDbRefList(dbRefList: DBRef[]) {
    this.dbRefList = dbRefList;
  }

  setOrderBy(order: { [key: string]: number }) {
    this.orderBy = order;
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
      output: this.getOutput(),
      many: this.many,
      ...(this.fieldsSelection
        ? { fieldsSelection: this.fieldsSelection.toJSON() }
        : null),
      ...(this.selector ? { selector: this.selector.toJSON() } : null),
      ...(this.data ? { data: this.data.toJSON() } : null),
      ...(this.dataList ? { dataList: this.dataList.toJSON() } : null),
      ...(this.dbRef ? { dbRef: this.dbRef } : null),
      ...(this.dbRefList ? { dbRefList: this.dbRefList } : null),
      ...(this.orderBy ? { orderBy: this.orderBy } : null),
    };
  }
}
