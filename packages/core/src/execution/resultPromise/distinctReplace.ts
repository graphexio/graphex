import * as R from 'ramda';
import { AMResultPromise, Transformation } from './resultPromise';
import { mapPath } from './utils';
import { AMOperation } from '../operation';

export class DistinctReplace extends Transformation {
  constructor(
    public path: string[],
    public displayField: string,
    public storeField: string,
    public relationField: string,
    public dataOp: AMOperation,
    public conditions?: Map<string, string>
  ) {
    super();
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
          resultValue = storeValue.map(v => dataMap[v]);
        } else {
          resultValue = dataMap[storeValue];
        }
        return { ...item, [this.displayField]: resultValue };
        // if (
        //   typeof item === 'string' ||
        //   (item !== null &&
        //     typeof item === 'object' &&
        //     item.constructor.name === 'ObjectID')
        // ) {
        //   return dataMap[item];
        // } else {
        //   return item;
        // }
      };

      const newValue = mapPath(this.path, mapItem)(value);
      dest.resolve(newValue);
    });
    source.catch(dest.reject);
  }
}
