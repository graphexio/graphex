import pluralize from 'pluralize';
import R from 'ramda';
import { GraphQLNamedType } from 'graphql';

export const operationAccessRule = (regex) => () => undefined;

export const regexFields = (regex) => (schema) => ({ type, field }) => {
  return regex.test(`${type.name}.${field.name}`);
};

export const anyField = (schema) => ({ type, field }) => {
  return !['Query', 'Mutation', 'Subscription'].includes(type.name);
};

export const allQueries = (schema) => ({ type, field }) => {
  return type.name === 'Query';
};

export const allMutations = (schema) => ({ type, field }) => {
  return type.name === 'Mutation';
};

export const allACLTypes = (schema) => ({
  type,
  field,
}: {
  type: GraphQLNamedType;
  field;
}) => {
  return type.name.endsWith('WhereACLInput');
};

export const modelCustomActions = (modelName, actions: string[]) => (
  schema
) => {
  const modelNameToRegExp = (model) =>
    actions.map((action) => new RegExp(`^Mutation\\.${action}${model}$`));

  const modelNames = [modelName, pluralize(modelName)];
  const enableFields = R.pipe(
    R.chain(modelNameToRegExp),
    R.map(R.test)
  )(modelNames);

  return ({ type, field }) => {
    return R.anyPass(enableFields)(`${type.name}.${field.name}`);
  };
};
