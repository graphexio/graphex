import { AMResultPromise, Transformation } from './resultPromise';
import * as R from 'ramda';
import { mapPath } from './utils';

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

export class Lookup extends Transformation {
  constructor(
    public path: string,
    public relationField: string,
    public storeField: string,
    public data: AMResultPromise<any>,
    public many = true
  ) {
    super();
  }

  transform(source: AMResultPromise<any>, dest: AMResultPromise<any>) {
    const pathArr = this.path.split('.');
    const lookupFieldName = pathArr.pop();

    source.getPromise().then(async value => {
      const dataMap = groupForLookup(this.storeField)(
        await this.data.getPromise()
      );
      const mapItem = (item: any) => {
        let val = dataMap[item[this.relationField]] || [];
        if (!this.many) {
          val = R.head(val);
        }
        return {
          ...item,
          [lookupFieldName]: val,
        };
      };
      const newValue = mapPath(pathArr, mapItem)(value);
      dest.resolve(newValue);
    });
    source.getPromise().catch(dest.reject);
  }
}
