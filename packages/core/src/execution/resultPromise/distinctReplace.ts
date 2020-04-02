import * as R from 'ramda';
import { AMResultPromise } from '.';

const replaceDistinct = (
  pathArr: string[],
  field: string,
  dataMap: { [key: string]: any }
) => (value: any) => {
  if (!value) return value;
  if (value instanceof Array) {
    return value.map(replaceDistinct(pathArr, field, dataMap));
  } else {
    if (pathArr.length == 0) {
      //TODO: Remove this fix for issue with multiple relations on the same field
      if (
        typeof value === 'string' ||
        (typeof value === 'object' && value.constructor.name === 'ObjectID')
      ) {
        return dataMap[value];
      } else {
        return value;
      }
    } else {
      return {
        ...value,
        [pathArr[0]]: replaceDistinct(
          pathArr.slice(1),
          field,
          dataMap
        )(value[pathArr[0]]),
      };
    }
  }
};

export const distinctReplace = (
  path: string,
  field: string,
  getData: () => AMResultPromise<any>
) => (source: AMResultPromise<any>, dest: AMResultPromise<any>) => {
  const pathArr = path.split('.');
  source.getPromise().then(async value => {
    const dataMap = R.indexBy(R.prop(field), await getData().getPromise());
    const newValue = replaceDistinct(pathArr, field, dataMap)(value);
    dest.resolve(newValue);
  });
  source.getPromise().catch(dest.reject);

  return `distinctReplace('${path}', '${field}', ${getData().toJSON()})`;
};
