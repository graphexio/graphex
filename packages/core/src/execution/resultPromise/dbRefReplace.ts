import { AMResultPromise } from './resultPromise';
import { mapPath } from './utils';
import { DBRef } from 'mongodb';

export const dbRefReplace = (
  path: string,
  getData: () => AMResultPromise<any>
) => (source: AMResultPromise<any>, dest: AMResultPromise<any>) => {
  const pathArr = path.split('.');
  source.then(async value => {
    const dataMap = await getData();
    const mapItem = (item: DBRef) => ({
      ...dataMap[item.namespace][item.oid.toHexString()],
      mmCollectionName: item.namespace,
    });
    const newValue = mapPath(pathArr, mapItem)(value);
    dest.resolve(newValue);
  });
  source.catch(dest.reject);

  return `dbRefReplace('${path}', ${getData().toJSON()})`;
};
