import { AMResultPromise } from './resultPromise';
import { getPath } from './utils';

export const distinct = (path: string) => (
  source: AMResultPromise<any>,
  dest: AMResultPromise<any>
) => {
  const pathArr = path.split('.');
  source.getPromise().then(value => {
    let dValue = getPath(pathArr)(value) || [];
    if (!Array.isArray(dValue)) dValue = [dValue];
    dest.resolve(dValue);
  });
  source.getPromise().catch(dest.reject);

  return `distinct('${path}')`;
};
