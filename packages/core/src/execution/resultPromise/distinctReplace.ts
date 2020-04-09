import * as R from 'ramda';
import { AMResultPromise } from './resultPromise';
import { mapPath } from './utils';

export const distinctReplace = (
  path: string,
  field: string,
  getData: () => AMResultPromise<any>
) => (source: AMResultPromise<any>, dest: AMResultPromise<any>) => {
  const pathArr = path.split('.');
  source.then(async value => {
    const dataMap = R.indexBy(R.prop(field), await getData().getPromise());
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

  return `distinctReplace('${path}', '${field}', ${getData().toJSON()})`;
};
