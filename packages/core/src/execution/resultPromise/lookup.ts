import * as R from 'ramda';
import { AMOperation } from '../operation';
import { Path } from '../path';
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
    // if (relationValue) {
    if (Array.isArray(relationValue)) {
      relationValue.forEach(relationValueArrayItem => {
        storeValue(relationValueArrayItem, item);
      });
    } else {
      storeValue(relationValue, item);
    }
    // }
  });
  return result;
};

export class Lookup extends RelationTransformation {
  constructor(
    public path: Path,
    public displayFieldPath: Path,
    public relationField: string,
    public storeField: string,
    dataOp: AMOperation,
    public many = true
  ) {
    super();
    this.dataOp = dataOp;
  }

  transform(source: AMResultPromise<any>, dest: AMResultPromise<any>) {
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
        return R.assocPath(this.displayFieldPath.asArray(), val, item);
      };

      const newValue = mapPath(
        this.path.asArray(),
        mapItem,
        [],
        this.getConditions()
      )(value);
      dest.resolve(newValue);
    });
    source.getPromise().catch(dest.reject);
  }
}
