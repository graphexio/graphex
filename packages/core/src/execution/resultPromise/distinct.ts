import { AMResultPromise } from './resultPromise';

const getDistinct = (pathArr: string[]) => (value: any) => {
  if (!value) {
    return null;
  }
  if (value instanceof Array) {
    return value.flatMap(getDistinct(pathArr));
  } else {
    if (pathArr.length == 0) {
      return [value];
    } else {
      const nextValue = value[pathArr[0]];
      if (nextValue) {
        return getDistinct(pathArr.slice(1))(nextValue);
      } else {
        return [];
      }
    }
  }
};

export const distinct = (path: string) => (
  source: AMResultPromise<any>,
  dest: AMResultPromise<any>
) => {
  const pathArr = path.split('.');
  source.getPromise().then(value => {
    const dValue = getDistinct(pathArr)(value);
    dest.resolve(dValue);
  });
  source.getPromise().catch(dest.reject);

  return `distinct('${path}')`;
};
