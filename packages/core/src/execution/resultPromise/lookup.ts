import * as R from 'ramda';
import { AMOperation } from '../operation';
import { RelationTransformation } from './relationTransformation';
import { AMResultPromise } from './resultPromise';
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

export class Lookup extends RelationTransformation {
  constructor(
    public path: string,
    public relationField: string,
    public storeField: string,
    public dataOp: AMOperation,
    public many = true
  ) {
    super();
  }

  transform(source: AMResultPromise<any>, dest: AMResultPromise<any>) {
    const pathArr = this.path.split('.');
    const lookupFieldName = pathArr.pop();

    source.getPromise().then(async value => {
      const dataMap = groupForLookup(this.storeField)(
        await this.dataOp.getOutput().getPromise()
      );
      const mapItem = (item: any) => {
        if (!item) return item;
        let val = dataMap[item[this.relationField]] || [];
        if (!this.many) {
          val = R.head(val);
        }
        const result = {
          ...item,
          [lookupFieldName]: val,
        };
        return result;
      };
      const newValue = mapPath(
        pathArr,
        mapItem,
        [],
        this.getConditions()
      )(value);
      dest.resolve(newValue);
    });
    source.getPromise().catch(dest.reject);
  }
}
