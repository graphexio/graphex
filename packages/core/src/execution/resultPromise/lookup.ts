import { AMResultPromise } from './resultPromise';
import * as R from 'ramda';
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

export const lookup = (
  path: string,
  relationField: string,
  storeField: string,
  getData: () => AMResultPromise<any>,
  many = true
) => (source: AMResultPromise<any>, dest: AMResultPromise<any>) => {
  const pathArr = path.split('.');
  const lookupFieldName = pathArr.pop();

  source.getPromise().then(async value => {
    const dataMap = groupForLookup(storeField)(await getData().getPromise());
    const mapItem = (item: any) => {
      let val = dataMap[item[relationField]] || [];
      if (!many) {
        val = R.head(val);
      }
      return {
        ...item,
        [lookupFieldName]: val,
      };
    };
    const newValue = mapPath(pathArr, mapItem)(value);
    dest.resolve(newValue);
  });
  source.getPromise().catch(dest.reject);

  return `lookup('${path}', '${relationField}', '${storeField}', ${getData().toJSON()}, ${many})`;
};
