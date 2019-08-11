import pluralize from 'pluralize';
import { lowercaseFirstLetter } from './utils';
import R from 'ramda';

export const MULTIPLE_QUERY = 'multipleQuery';
export const SINGLE_QUERY = 'singleQuery';
export const CONNECTION_QUERY = 'connectionQuery';
export const MULTIPLE_PAGINATION_QUERY = 'multiplePaginationQuery';
export const CREATE_MUTATION = 'createMutation';
export const DELETE_MUTATION = 'deleteMutation';
export const DELETE_MANY_MUTATION = 'deleteManyMutation';
export const UPDATE_MUTATION = 'updateMutation';

const transformations = {
  [MULTIPLE_QUERY]: R.pipe(
    pluralize,
    lowercaseFirstLetter
  ),
  [SINGLE_QUERY]: lowercaseFirstLetter,
  [CONNECTION_QUERY]: R.pipe(
    pluralize,
    lowercaseFirstLetter,
    R.concat(R.__, 'Connection')
  ),
  [MULTIPLE_PAGINATION_QUERY]: R.pipe(
    pluralize,
    lowercaseFirstLetter,
    R.concat(R.__, 'Paged')
  ),
  [CREATE_MUTATION]: R.concat('create'),
  [DELETE_MUTATION]: R.concat('delete'),
  [DELETE_MANY_MUTATION]: R.pipe(
    pluralize,
    R.concat('delete')
  ),
  [UPDATE_MUTATION]: R.concat('update'),
};

export const getMethodName = R.curry((kind, modelName) => {
  return transformations[kind](modelName);
});

const operations = {
  [MULTIPLE_QUERY]: 'Query',
  [SINGLE_QUERY]: 'Query',
  [CONNECTION_QUERY]: 'Query',
  [MULTIPLE_PAGINATION_QUERY]: 'Query',
  [CREATE_MUTATION]: 'Mutation',
  [DELETE_MUTATION]: 'Mutation',
  [DELETE_MANY_MUTATION]: 'Mutation',
  [UPDATE_MUTATION]: 'Mutation',
};
export const getOperationName = kind => {
  return operations[kind];
};
