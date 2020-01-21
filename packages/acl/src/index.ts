import pluralize from 'pluralize';
import R from 'ramda';
import { GraphQLNamedType } from 'graphql';

export { applyRules } from './applyRules';
export { modelDefaultActions } from './modelDefaultActions';
export { modelField } from './modelField';
export { modelDefault } from './modelDefault';

export const operationAccessRule = regex => () => {};

export const regexFields = regex => ({ type, field }) => {
  return regex.test(`${type.name}.${field.name}`);
};

export const anyField = ({ type, field }) => {
  return !['Query', 'Mutation', 'Subscription'].includes(type.name);
};

export const allQueries = ({ type, field }) => {
  return type.name === 'Query';
};

export const allMutations = ({ type, field }) => {
  return type.name === 'Mutation';
};

export const allACLTypes = ({
  type,
  field,
}: {
  type: GraphQLNamedType;
  field;
}) => {
  return type.name.endsWith('WhereACLInput');
};

export const modelCustomActions = (modelName, actions: string[]) => {
  const modelNameToRegExp = model =>
    actions.map(action => new RegExp(`^Mutation\\.${action}${model}$`));

  const modelNames = [modelName, pluralize(modelName)];
  const enableFields = R.pipe(
    R.chain(modelNameToRegExp),
    R.map(R.test)
  )(modelNames);

  return ({ type, field }) => {
    return R.anyPass(enableFields)(`${type.name}.${field.name}`);
  };
};
