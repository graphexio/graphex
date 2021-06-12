import { ObjectEntriesWithSymbols } from '../../utils';
import { AMResultPromise } from './resultPromise';

export const getPath = (path: string[]) => (value: any) => {
  if (path.length !== 0 && !value) {
    return value;
  } else if (value instanceof Array) {
    return value.flatMap(getPath(path));
  } else {
    if (path.length == 0) {
      return value;
    } else {
      const [pathSection, ...restPath] = path;
      return getPath(restPath)(value[pathSection]);
    }
  }
};

export const mapPath = <T>(
  path: string[],
  mapFn: (item: T) => T,
  currentPath: string[] = []
) => (value: any) => {
  if (!value) {
    return value;
  } else if (value instanceof Array) {
    return value.map(mapPath(path, mapFn, currentPath));
  } else {
    if (path.length == 0) {
      return mapFn(value);
    } else {
      const [pathSection, ...restPath] = path;
      return {
        ...value,
        [pathSection]: mapPath(restPath, mapFn, [...currentPath, pathSection])(
          value[pathSection]
        ),
      };
    }
  }
};

export async function completeAMResultPromise(obj: any) {
  if (obj instanceof AMResultPromise) {
    return await obj.getPromise();
  } else if (obj && obj.constructor && obj.constructor.name == 'Object') {
    return Object.fromEntries(
      await Promise.all(
        ObjectEntriesWithSymbols(obj).map(async ([k, v]) => {
          return [k, await completeAMResultPromise(v)];
        })
      )
    );
  } else if (obj && obj.constructor && obj.constructor.name == 'Array') {
    return await Promise.all(
      obj.map(v => {
        return completeAMResultPromise(v);
      })
    );
  } else {
    return obj;
  }
}
