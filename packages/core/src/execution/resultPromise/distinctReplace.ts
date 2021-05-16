import * as R from 'ramda';
import { AMOperation } from '../operation';
import { Path } from '../path';
import { RelationTransformation } from './relationTransformation';
import { AMResultPromise } from './resultPromise';
import { mapPath } from './utils';

export class DistinctReplace extends RelationTransformation {
  constructor(
    public path: Path,
    public displayField: Path,
    public storeField: string,
    public relationField: string,
    dataOp: AMOperation
  ) {
    super();
    this.dataOp = dataOp;
  }

  transform(source: AMResultPromise<any>, dest: AMResultPromise<any>) {
    source.then(async value => {
      const dataMap = R.indexBy(
        R.prop(this.relationField),
        await this.dataOp.getOutput().getPromise()
      );
      const mapItem = item => {
        if (!item) return item;
        const storeValue = item[this.storeField];
        let resultValue;
        if (Array.isArray(storeValue)) {
          resultValue = storeValue.map(v => dataMap[v]).filter(v => v);
        } else {
          resultValue = dataMap[storeValue];
        }
        return R.assocPath(this.displayField.asArray(), resultValue, item);
      };

      const newValue = mapPath(
        this.path.asArray(),
        mapItem,
        [],
        this.getConditions()
      )(value);
      dest.resolve(newValue);
    });
    source.catch(dest.reject);
  }
}
