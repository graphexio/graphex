export class Path {
  static fromArray(arr: string[]) {
    return new Path(arr);
  }
  static fromString(path: string) {
    return new Path(path.split('.'));
  }

  constructor(private _pathArr: string[]) {}

  clone() {
    return new Path([...this._pathArr]);
  }

  asArray() {
    return this._pathArr;
  }
  asString() {
    return this._pathArr.join('.');
  }

  pop() {
    return this._pathArr.pop();
  }

  toJSON() {
    return this.asString();
  }
}
