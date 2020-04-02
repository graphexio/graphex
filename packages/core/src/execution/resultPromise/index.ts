import { DBRef, ObjectID } from 'mongodb';
import R, { where } from 'ramda';
import { AMOperation } from '../operation';
export { ResultPromiseTransforms } from './transforms';

type AMValueSource = AMOperation | AMResultPromise<any>;

export class AMResultPromise<T> {
  private promise: Promise<T>;
  public resolve: (value: T) => void;
  public reject: (error: any) => void;
  public transformationDescription: string;

  _valueSource: AMValueSource;

  constructor(source: AMValueSource) {
    this._valueSource = source;

    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  toJSON() {
    return `AMResultPromise { ${this.getValueSource()} }`;
  }

  getPromise() {
    return this.promise;
  }

  getValueSource(): string {
    if (this._valueSource instanceof AMOperation) {
      return this._valueSource.getIdentifier();
    } else if (this._valueSource instanceof AMResultPromise) {
      return `${this._valueSource.getValueSource()} -> ${
        this.transformationDescription
      }`;
    }
  }

  then(callback: (value: T) => void) {
    return this.promise.then(callback);
  }

  catch(callback: (err: Error) => void) {
    return this.promise.catch(callback);
  }

  map(
    mapFn: (source: AMResultPromise<T>, result: AMResultPromise<T>) => string
  ) {
    const newResult = new AMResultPromise<T>(this);
    newResult.transformationDescription = mapFn(this, newResult);
    return newResult;
  }

  /* Pick value at path */
  path(path: string) {
    return new AMPathResultPromise(this, this.promise, path);
  }

  //   /* Pick all values at path, even inside arrays. */
  //   distinct(path: string) {
  //     return new AMDistinctResultPromise(this, this.promise, path);
  //   }

  distinctReplace(
    path: string,
    field: string,
    getData: () => AMResultPromise<any>
  ) {
    return new AMDistinctReplaceResultPromise(this, this.promise, {
      path,
      field,
      getData,
    });
  }

  lookup(
    path: string,
    relationField: string,
    storeField: string,
    getData: () => AMResultPromise<any>,
    many = true
  ) {
    return new AMLookupResultPromise(this, this.promise, {
      path,
      relationField,
      storeField,
      getData,
      many,
    });
  }

  dbRef(collectionName: string) {
    return new AMDBRefResultPromise(this, this.promise, {
      collectionName,
    });
  }

  dbRefReplace(path: string, getData: () => AMResultPromise<any>) {
    return new AMDBRefReplaceResultPromise(this, this.promise, {
      path,
      getData,
    });
  }

  transformArray(path: string, params: { where: { [key: string]: any } }) {
    return new AMTransformArrayResultPromise(this, this.promise, {
      path,
      where: params.where,
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

export class AMDataResultPromise<T> extends AMResultPromise<T> {
  _data: any;

  constructor(data: any) {
    super(data);
    this._data = data;
    this.resolve(data);
  }

  getValueSource() {
    return 'Static Data';
  }
}

//////////////////////////////////////////////////

const getDistinct = (pathArr: string[]) => (value: any) => {
  if (!value) {
    return null;
  }
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
  if (!value) return value;
  if (value instanceof Array) {
    return value.map(replaceDistinct(pathArr, field, dataMap));
  } else {
    if (pathArr.length == 0) {
      //TODO: Remove this fix for issue with multiple relations on the same field
      if (
        typeof value === 'string' ||
        (typeof value === 'object' && value.constructor.name === 'ObjectID')
      ) {
        return dataMap[value];
      } else {
        return value;
      }
    } else {
      return {
        ...value,
        [pathArr[0]]: replaceDistinct(
          pathArr.slice(1),
          field,
          dataMap
        )(value[pathArr[0]]),
      };
    }
  }
};

export class AMDistinctReplaceResultPromise<T> extends AMResultPromise<T> {
  _params: { path: string; field: string; getData: () => AMResultPromise<any> };

  constructor(
    source: AMResultPromise<any>,
    promise: Promise<T>,
    params: { path: string; field: string; getData: () => AMResultPromise<any> }
  ) {
    super(source);
    this._params = params;
    const pathArr = params.path.split('.');
    promise.then(async value => {
      const dataMap = R.indexBy(
        R.prop(params.field),
        await params.getData().getPromise()
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
      }', '${this._params.field}', ${this._params.getData().toJSON()})`;
    }
  }
}

//////////////////////////////////////////////////

export class AMPathResultPromise<T> extends AMResultPromise<T> {
  _path: string;

  constructor(source: AMResultPromise<any>, promise: Promise<T>, path: string) {
    super(source);
    this._path = path;
    const getPath = R.path<any>(path.split('.'));
    promise.then(async value => {
      const newValue = getPath(value);
      this.resolve(newValue);
    });
    promise.catch(this.reject);
  }

  getValueSource(): string {
    if (this._valueSource instanceof AMResultPromise) {
      return `${this._valueSource.getValueSource()} -> path('${this._path}')`;
    }
  }
}

//////////////////////////////////////////////////

const groupForLookup = (storeField: string) => (
  data: { [key: string]: any }[]
) => {
  const result = {};
  const storeValue = (key: string, value: any) => {
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(value);
  };

  data.forEach(item => {
    const relationValue = item[storeField];
    if (relationValue) {
      if (Array.isArray(relationValue)) {
        relationValue.forEach(relationValueArrayItem => {
          storeValue(relationValueArrayItem, item);
        });
      } else {
        storeValue(relationValue, item);
      }
    }
  });
  return result;
};

const lookup = (
  pathArr: string[],
  relationField: string,
  dataMap: { [key: string]: any[] },
  many: boolean
) => (value: any) => {
  if (value instanceof Array) {
    return value.map(lookup(pathArr, relationField, dataMap, many));
  } else {
    if (pathArr.length === 0) {
      return null;
    } else if (pathArr.length === 1) {
      let val = dataMap[value[relationField]] || [];
      if (!many) {
        val = R.head(val);
      }
      return {
        ...value,
        [pathArr[0]]: val,
      };
    } else {
      return {
        ...value,
        [pathArr[0]]: lookup(
          pathArr.slice(1),
          relationField,
          dataMap,
          many
        )(value[pathArr[0]]),
      };
    }
  }
};

export class AMLookupResultPromise<T> extends AMResultPromise<T> {
  _params: {
    path: string;
    relationField: string;
    storeField: string;
    getData: () => AMResultPromise<any>;
    many: boolean;
  };

  constructor(
    source: AMResultPromise<any>,
    promise: Promise<T>,
    params: {
      path: string;
      relationField: string;
      storeField: string;
      getData: () => AMResultPromise<any>;
      many: boolean;
    }
  ) {
    super(source);
    this._params = params;
    const pathArr = params.path.split('.');
    promise.then(async value => {
      const dataMap = groupForLookup(params.storeField)(
        await params.getData().getPromise()
      );

      const newValue = lookup(
        pathArr,
        params.relationField,
        dataMap,
        params.many
      )(value);
      this.resolve(newValue);
    });
    promise.catch(this.reject);
  }

  getValueSource(): string {
    if (this._valueSource instanceof AMResultPromise) {
      return `${this._valueSource.getValueSource()} -> lookup('${
        this._params.path
      }', '${this._params.relationField}', '${
        this._params.storeField
      }', ${this._params.getData().toJSON()}, ${this._params.many})`;
    }
  }
}

//////////////////////////////////////////////////

const replaceDBRef = (pathArr: string[], dataMap: { [key: string]: any }) => (
  value: any
) => {
  if (value instanceof Array) {
    return value.map(replaceDBRef(pathArr, dataMap));
  } else {
    if (pathArr.length == 0) {
      return {
        ...dataMap[value.namespace][value.oid],
        mmCollectionName: value.namespace,
      };
    } else {
      return {
        ...value,
        [pathArr[0]]: replaceDBRef(
          pathArr.slice(1),
          dataMap
        )(value[pathArr[0]]),
      };
    }
  }
};

export class AMDBRefReplaceResultPromise<T> extends AMResultPromise<T> {
  _params: {
    path: string;
    getData: () => AMResultPromise<any>;
  };

  constructor(
    source: AMResultPromise<any>,
    promise: Promise<T>,
    params: {
      path: string;
      getData: () => AMResultPromise<any>;
    }
  ) {
    super(source);
    this._params = params;
    const pathArr = params.path.split('.');
    promise.then(async value => {
      const newValue = replaceDBRef(
        pathArr,
        await this._params.getData()
      )(value);
      this.resolve(newValue);
    });
    promise.catch(this.reject);
  }

  getValueSource(): string {
    if (this._valueSource instanceof AMResultPromise) {
      return `${this._valueSource.getValueSource()} -> dbRefReplace('${
        this._params.path
      }', ${this._params.getData().toJSON()})`;
    }
  }
}

//////////////////////////////////////////////////

export class AMDBRefResultPromise<T> extends AMResultPromise<DBRef | DBRef[]> {
  _params: {
    collectionName: string;
  };

  constructor(
    source: AMResultPromise<any>,
    promise: Promise<T>,
    params: {
      collectionName: string;
    }
  ) {
    super(source);
    this._params = params;
    promise.then(async value => {
      if (Array.isArray(value)) {
        this.resolve(
          value.map(id => new DBRef(this._params.collectionName, id))
        );
      } else if (value instanceof ObjectID) {
        this.resolve(new DBRef(this._params.collectionName, value));
      }
    });
    promise.catch(this.reject);
  }

  getValueSource(): string {
    if (this._valueSource instanceof AMResultPromise) {
      return `${this._valueSource.getValueSource()} -> dbRef('${
        this._params.collectionName
      }')`;
    }
  }
}

//////////////////////////////////////////////////

export class AMTransformArrayResultPromise<T> extends AMResultPromise<T> {
  constructor(
    source: AMResultPromise<any>,
    promise: Promise<T>,
    private params: {
      path: string;
      where: { [key: string]: any };
    }
  ) {
    super(source);

    promise.then(async value => {
      if (Array.isArray(value)) {
        this.resolve(
          value.map(item => {
            const array = R.path(params.path.split('.'), item) as [];
            const keys = Object.keys(params.where);

            const filteredArray = R.filter(item => {
              const picked = R.pick(keys, item);
              return R.equals(picked, params.where);
            }, array);

            return R.assocPath(params.path.split('.'), filteredArray, item);
          }) as any
        );
      }
    });
    promise.catch(this.reject);
  }

  getValueSource(): string {
    if (this._valueSource instanceof AMResultPromise) {
      return `${this._valueSource.getValueSource()} \n-> transformArray('${
        this.params.path
      }', ${JSON.stringify({ where: this.params.where })}')`;
    }
  }
}
