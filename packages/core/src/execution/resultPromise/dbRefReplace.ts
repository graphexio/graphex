import { AMResultPromise, Transformation } from './resultPromise';
import { mapPath } from './utils';
import { DBRef } from 'mongodb';
import { AMOperation } from '../operation';

export class DbRefReplace extends Transformation {
  constructor(public path: string, public dataOp: AMOperation) {
    super();
  }

  transform(source: AMResultPromise<any>, dest: AMResultPromise<any>) {
    const pathArr = this.path.split('.');
    source.then(async value => {
      const dataMap = await this.dataOp.getOutput().getPromise();
      const mapItem = (item: DBRef) => ({
        ...dataMap[item.namespace][item.oid.toHexString()],
        mmCollectionName: item.namespace,
      });
      const newValue = mapPath(pathArr, mapItem)(value);
      dest.resolve(newValue);
    });
    source.catch(dest.reject);
  }
}
