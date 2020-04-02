import * as R from 'ramda';
import { AMResultPromise } from '.';

export const path = (path: string) => (
  source: AMResultPromise<any>,
  dest: AMResultPromise<any>
) => {
  const getPath = R.path<any>(path.split('.'));
  source.getPromise().then(async value => {
    const newValue = getPath(value);
    dest.resolve(newValue);
  });
  source.getPromise().catch(dest.reject);

  return `path('${path}')`;
};
