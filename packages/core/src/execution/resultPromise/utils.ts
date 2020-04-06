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

export const mapPath = <T>(path: string[], mapFn: (item: T) => T) => (
  value: any
) => {
  if (path.length !== 0 && !value) {
    return value;
  } else if (value instanceof Array) {
    return value.map(mapPath(path, mapFn));
  } else {
    if (path.length == 0) {
      return mapFn(value);
    } else {
      const [pathSection, ...restPath] = path;
      return {
        ...value,
        [pathSection]: mapPath(restPath, mapFn)(value[pathSection]),
      };
    }
  }
};
