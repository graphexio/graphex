import { AMResultPromise } from '.';

const replaceDBRef = (pathArr: string[], dataMap: { [key: string]: any }) => (
  value: any
) => {
  if (value instanceof Array) {
    return value.map(replaceDBRef(pathArr, dataMap));
  } else {
    if (pathArr.length == 0) {
      return {
        ...dataMap[value.namespace][value.oid],
        mmCollectionName: value.namespace,
      };
    } else {
      return {
        ...value,
        [pathArr[0]]: replaceDBRef(
          pathArr.slice(1),
          dataMap
        )(value[pathArr[0]]),
      };
    }
  }
};

export const dbRefReplace = (
  path: string,
  getData: () => AMResultPromise<any>
) => (source: AMResultPromise<any>, dest: AMResultPromise<any>) => {
  const pathArr = path.split('.');
  source.then(async value => {
    const newValue = replaceDBRef(pathArr, await getData())(value);
    dest.resolve(newValue);
  });
  source.catch(dest.reject);

  return `dbRefReplace('${path}', ${getData().toJSON()})`;
};
