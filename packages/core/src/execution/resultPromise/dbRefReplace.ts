import { AMResultPromise, Transformation } from './resultPromise';
import { mapPath } from './utils';
import { DBRef } from 'mongodb';

export class DbRefReplace extends Transformation {
  constructor(public path: string, public data: AMResultPromise<any>) {
    super();
  }

  transform(source: AMResultPromise<any>, dest: AMResultPromise<any>) {
    const pathArr = this.path.split('.');
    source.then(async value => {
      const dataMap = await this.data;
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
