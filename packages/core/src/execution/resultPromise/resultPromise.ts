import { AMOperation } from '../operation';
type AMValueSource = AMOperation | AMResultPromise<any>;

export class AMResultPromise<T> {
  private promise: Promise<T>;
  public resolve: (value: T) => void;
  public reject: (error: any) => void;
  public transformationDescription: string;

  constructor(private valueSource: AMValueSource) {
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
    if (this.valueSource instanceof AMOperation) {
      return this.valueSource.getIdentifier();
    } else if (this.valueSource instanceof AMResultPromise) {
      return `${this.valueSource.getValueSource()} -> ${
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
}

export class AMOperationResultPromise<T> extends AMResultPromise<T> {
  constructor(source: AMOperation) {
    super(source);
  }
}

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
