import { AMResultPromise } from './resultPromise';
import { getPath } from './utils';

export const path = (path: string) => (
  source: AMResultPromise<any>,
  dest: AMResultPromise<any>
) => {
  source.getPromise().then(async value => {
    const newValue = getPath(path.split('.'))(value);
    dest.resolve(newValue);
  });
  source.getPromise().catch(dest.reject);

  return `path('${path}')`;
};
