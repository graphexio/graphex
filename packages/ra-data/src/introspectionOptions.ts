import camelCase from 'lodash/camelCase';
import pluralize from 'pluralize';
import {
  CREATE,
  DELETE,
  GET_LIST,
  GET_MANY,
  GET_MANY_REFERENCE,
  GET_ONE,
  UPDATE,
} from 'react-admin';
import { Resource } from './definitions';

export default {
  operationNames: {
    [GET_LIST]: (resource: Resource) =>
      `${pluralize(camelCase(resource.name))}`,
    [GET_ONE]: (resource: Resource) => `${camelCase(resource.name)}`,
    [GET_MANY]: (resource: Resource) =>
      `${pluralize(camelCase(resource.name))}`,
    [GET_MANY_REFERENCE]: (resource: Resource) =>
      `${pluralize(camelCase(resource.name))}`,
    [CREATE]: (resource: Resource) => `create${resource.name}`,
    [UPDATE]: (resource: Resource) => `update${resource.name}`,
    [DELETE]: (resource: Resource) => `delete${resource.name}`,
  },
  exclude: undefined,
  include: undefined,
};
