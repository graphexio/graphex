import * as R from 'ramda';
import { AMResultPromise } from './resultPromise';

export const transformArray = (
  path: string,
  filterParams: { where: { [key: string]: any } }
) => (source: AMResultPromise<any>, dest: AMResultPromise<any>) => {
  source.then(async value => {
    if (Array.isArray(value)) {
      dest.resolve(
        value.map(item => {
          const array = R.path(path.split('.'), item) as [];
          const keys = Object.keys(filterParams.where);

          const filteredArray = R.filter(item => {
            const picked = R.pick(keys, item);
            return R.equals(picked, filterParams.where);
          }, array);

          return R.assocPath(path.split('.'), filteredArray, item);
        }) as any
      );
    }
  });
  source.catch(dest.reject);
  return `transformArray('${path}', ${JSON.stringify(filterParams)}')`;
};
