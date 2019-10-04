import call from 'ramda/es/call';
import { AMOperation } from './operation';
import R from 'ramda';

enum AMResultPromiseMethod {
  map,
}

type AMValueSource = AMOperation | AMResultPromise<any>;

export class AMResultPromise<T> {
  _promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (value: T) => void;

  _valueSource: AMValueSource;

  constructor(source: AMValueSource) {
    this._valueSource = source;

    this._promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  toJSON() {
    return `AMResultPromise { ${this.getValueSource()} }`;
  }

  getPromise() {
    return this._promise;
  }

  getValueSource(): string {
    if (this._valueSource instanceof AMOperation) {
      return this._valueSource.getIdentifier();
    }
  }

  then(callback: (value: T) => void) {
    return this._promise.then(callback);
  }

  catch(callback: (err: Error) => void) {
    return this._promise.catch(callback);
  }

  distinct(path: string) {
    return new AMDistinctResultPromise(this, this._promise, path);
  }

  distinctReplace(path: string, field: string, data: AMResultPromise<any>) {
    return new AMDistinctReplaceResultPromise(this, this._promise, {
      path,
      field,
      data,
    });
  }
}

//////////////////////////////////////////////////

export class AMOperationResultPromise<T> extends AMResultPromise<T> {
  constructor(source: AMOperation) {
    super(source);
  }
}

//////////////////////////////////////////////////

const getDistinct = (pathArr: string[]) => (value: any) => {
  if (value instanceof Array) {
    return value.flatMap(getDistinct(pathArr));
  } else {
    if (pathArr.length == 0) {
      return [value];
    } else {
      const nextValue = value[pathArr[0]];
      if (nextValue) {
        return getDistinct(pathArr.slice(1))(nextValue);
      } else {
        return [];
      }
    }
  }
};

export class AMDistinctResultPromise<T> extends AMResultPromise<T> {
  _path: string;

  constructor(source: AMResultPromise<any>, promise: Promise<T>, path: string) {
    super(source);
    this._path = path;
    const pathArr = path.split('.');
    promise.then(value => {
      const dValue = getDistinct(pathArr)(value);
      this.resolve(dValue);
    });
    promise.catch(this.reject);
  }

  getValueSource(): string {
    if (this._valueSource instanceof AMResultPromise) {
      return `${this._valueSource.getValueSource()} -> distinct('${
        this._path
      }')`;
    }
  }
}

//////////////////////////////////////////////////

const replaceDistinct = (
  pathArr: string[],
  field: string,
  dataMap: { [key: string]: any }
) => (value: any) => {
  if (value instanceof Array) {
    return value.map(replaceDistinct(pathArr, field, dataMap));
  } else {
    if (pathArr.length == 0) {
      return dataMap[value];
    } else {
      return {
        ...value,
        [pathArr[0]]: replaceDistinct(pathArr.slice(1), field, dataMap)(
          value[pathArr[0]]
        ),
      };
    }
  }
};

export class AMDistinctReplaceResultPromise<T> extends AMResultPromise<T> {
  _params: { path: string; field: string; data: AMResultPromise<any> };

  constructor(
    source: AMResultPromise<any>,
    promise: Promise<T>,
    params: { path: string; field: string; data: AMResultPromise<any> }
  ) {
    super(source);
    this._params = params;
    const pathArr = params.path.split('.');
    promise.then(async value => {
      const dataMap = R.indexBy(
        R.prop(params.field),
        await params.data.getPromise()
      );
      const newValue = replaceDistinct(pathArr, params.field, dataMap)(value);
      this.resolve(newValue);
    });
    promise.catch(this.reject);
  }

  getValueSource(): string {
    if (this._valueSource instanceof AMResultPromise) {
      return `${this._valueSource.getValueSource()} -> distinctReplace('${
        this._params.path
      }', '${this._params.field}', ${this._params.data.toJSON()})`;
    }
  }
}
