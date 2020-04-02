import { AMResultPromise } from './resultPromise';
import * as R from 'ramda';

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

const lookupReplace = (
  pathArr: string[],
  relationField: string,
  dataMap: { [key: string]: any[] },
  many: boolean
) => (value: any) => {
  if (value instanceof Array) {
    return value.map(lookupReplace(pathArr, relationField, dataMap, many));
  } else {
    if (pathArr.length === 0) {
      return null;
    } else if (pathArr.length === 1) {
      let val = dataMap[value[relationField]] || [];
      if (!many) {
        val = R.head(val);
      }
      return {
        ...value,
        [pathArr[0]]: val,
      };
    } else {
      return {
        ...value,
        [pathArr[0]]: lookupReplace(
          pathArr.slice(1),
          relationField,
          dataMap,
          many
        )(value[pathArr[0]]),
      };
    }
  }
};

export const lookup = (
  path: string,
  relationField: string,
  storeField: string,
  getData: () => AMResultPromise<any>,
  many = true
) => (source: AMResultPromise<any>, dest: AMResultPromise<any>) => {
  const pathArr = path.split('.');
  source.getPromise().then(async value => {
    const dataMap = groupForLookup(storeField)(await getData().getPromise());

    const newValue = lookupReplace(
      pathArr,
      relationField,
      dataMap,
      many
    )(value);
    dest.resolve(newValue);
  });
  source.getPromise().catch(dest.reject);

  return `lookup('${path}', '${relationField}', '${storeField}', ${getData().toJSON()}, ${many})`;
};
