import { AMContext } from './context';
import { AMFieldsSelectionContext } from './contexts/fieldsSelection';
import { AMSelectorContext } from './contexts/selector';
import { AMDBExecutor } from '../definitions';
import { AMResultPromise } from './resultPromise';
import { AMTransaction } from './transaction';
import { AMDataContext } from './contexts/data';
import { AMListValueContext } from './contexts/listValue';
import { Transformation } from './resultPromise';
import { DBRef } from 'mongodb';
import { compact } from '../utils';

export abstract class AMOperation extends AMContext {
  collectionName: string;
  fieldsSelection: AMFieldsSelectionContext;
  selector: AMSelectorContext;
  data: AMDataContext;
  dataList: AMListValueContext;
  dbRef: DBRef | AMResultPromise<DBRef>;
  dbRefList: DBRef[] | AMResultPromise<DBRef[]> | AMResultPromise<DBRef>[];
  many: boolean;
  orderBy: { [key: string]: number };
  skip: number;
  first: number;
  fieldTransformations: Map<string, Transformation[]> = new Map();

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
      skip?: number;
      first?: number;
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
    this.skip = config.skip;
    this.first = config.first;

    this._result = new AMResultPromise(this);
    this._transactionNumber = transaction.operations.length;
    transaction.addOperation(this);
  }

  getIdentifier() {
    return `Operation-${this._transactionNumber}`;
  }

  getFieldsSelection() {
    if (!this.fieldsSelection) {
      this.fieldsSelection = new AMFieldsSelectionContext();
    }
    return this.fieldsSelection;
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

  setSkip(skip: number) {
    this.skip = skip;
  }

  setFirst(first: number) {
    this.first = first;
  }

  abstract execute(executor: AMDBExecutor): void;

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

  addTransformation(transformation: Transformation) {
    this.setOutput(this.getOutput().map(transformation));
  }

  addFieldTransformation(path: string, transformation: Transformation) {
    let transformations = this.fieldTransformations.get(path);
    if (!transformations) {
      transformations = [transformation];
      this.fieldTransformations.set(path, transformations);
    } else {
      transformations.push(transformation);
    }
    this.setOutput(this.getOutput().map(transformation));
  }

  toJSON(): { [key: string]: any } {
    return compact({
      identifier: this.getIdentifier(),
      kind: this.constructor.name,
      collectionName: this.collectionName,
      output: this.getOutput(),
      many: this.many,
      fieldsSelection: this.fieldsSelection?.toJSON(),
      selector: this.selector?.toJSON(),
      data: this.data?.toJSON(),
      dataList: this.dataList?.toJSON(),
      dbRef: this.dbRef,
      dbRefList: this.dbRefList,
      orderBy: this.orderBy,
      skip: this.skip,
      first: this.first,
    });
  }
}
