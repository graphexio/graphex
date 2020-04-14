import { AMOperation } from '../operation';

type AMValueSource = AMOperation | AMResultPromise<any>;

export abstract class Transformation {
  abstract transform(
    source: AMResultPromise<any>,
    result: AMResultPromise<any>
  ): void;
}

export class ResultPromise {
  constructor(public source) {}
}

export class AMResultPromise<T> {
  private promise: Promise<T>;
  public resolve: (value: T) => void;
  public reject: (error: any) => void;
  public transformation: Transformation;

  constructor(private valueSource: AMValueSource) {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  toJSON() {
    return new ResultPromise(this.getValueSource());
  }

  getPromise() {
    return this.promise;
  }

  getValueSource(): any[] {
    if (this.valueSource instanceof AMOperation) {
      return [this.valueSource.getIdentifier()];
    } else if (this.valueSource instanceof AMResultPromise) {
      return [...this.valueSource.getValueSource(), this.transformation];
    }
  }

  then(callback: (value: T) => void) {
    return this.promise.then(callback);
  }

  catch(callback: (err: Error) => void) {
    return this.promise.catch(callback);
  }

  map(transformation: Transformation) {
    const newResult = new AMResultPromise<T>(this);
    newResult.transformation = transformation;
    transformation.transform(this, newResult);
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
    return ['Static Data'];
  }
}
