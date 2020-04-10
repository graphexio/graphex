import * as R from 'ramda';
import { AMResultPromise, Transformation } from './resultPromise';
import { mapPath } from './utils';

export class DistinctReplace extends Transformation {
  constructor(
    public path: string,
    public field: string,
    public data: AMResultPromise<any>
  ) {
    super();
  }

  transform(source: AMResultPromise<any>, dest: AMResultPromise<any>) {
    const pathArr = this.path.split('.');
    source.then(async value => {
      const dataMap = R.indexBy(
        R.prop(this.field),
        await this.data.getPromise()
      );
      const mapItem = item => {
        if (
          typeof item === 'string' ||
          (item !== null &&
            typeof item === 'object' &&
            item.constructor.name === 'ObjectID')
        ) {
          return dataMap[item];
        } else {
          return item;
        }
      };

      const newValue = mapPath(pathArr, mapItem)(value);
      dest.resolve(newValue);
    });
    source.catch(dest.reject);
  }
}
