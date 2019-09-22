import {
  SINGLE_QUERY,
  MULTIPLE_QUERY,
  CONNECTION_QUERY,
  MULTIPLE_PAGINATION_QUERY,
  CREATE_MUTATION,
  DELETE_MUTATION,
  DELETE_MANY_MUTATION,
  UPDATE_MUTATION,
  getMethodName,
  getOperationName,
} from '@apollo-model/core/lib/methodKinds.js';

import * as INPUT_KINDS from '@apollo-model/core/lib/inputTypes/kinds.js';
import { getInputTypeName } from '@apollo-model/core/lib/inputTypes/';

import { isInterfaceType } from 'graphql';

import SchemaFilter from '@apollo-model/schema-filter';
const { transformSchema } = require('graphql-tools');
import R from 'ramda';
import pluralize from 'pluralize';

export const applyRules = (
  schema,
  { allow: allowRules = [], deny: denyRules = [], defaults = [] }
) => {
  let filterFields = SchemaFilter(
    (type, field) => {
      let allow = { type, field, schema } |> R.anyPass(allowRules);
      let deny = { type, field, schema } |> R.anyPass(denyRules);

      return allow && !deny;
    },
    (type, field) => {
      let defaultFn = defaults.find(item => item.cond({ type, field }));
      if (!defaultFn) {
        return undefined;
      }
      return defaultFn.fn;
    }
  );

  return transformSchema(schema, [filterFields]);
};

const transformAccessToMethodKinds = access => {
  return {
    R: [
      SINGLE_QUERY,
      MULTIPLE_QUERY,
      CONNECTION_QUERY,
      MULTIPLE_PAGINATION_QUERY,
    ],
    C: [CREATE_MUTATION],
    D: [DELETE_MUTATION, DELETE_MANY_MUTATION],
    U: [UPDATE_MUTATION],
  }[access];
};

const kindToMethodRegExp = R.curry((modelName, kind) => {
  let operation = getOperationName(kind);
  let method = getMethodName(kind)(modelName);
  return new RegExp(`${operation}\\.${method}`);
});

export const modelDefaultActions = (modelName, access) => {
  const typeNameToRegExp = typeName =>
    access
    |> R.split('')
    |> R.chain(transformAccessToMethodKinds)
    |> R.map(kindToMethodRegExp(typeName))
    |> R.map(R.test);

  let possibleTypeNames = [modelName];

  return ({ type, field, schema }) => {
    if (schema) {
      let modelType = schema.getTypeMap()[modelName];
      if (!modelType) {
        return false;
      }
      if (isInterfaceType(modelType)) {
        let possibleTypes = schema.getPossibleTypes(modelType);
        possibleTypeNames = [
          modelName,
          ...possibleTypes.map(type => type.name),
        ];
      }
    }
    const enableFields = possibleTypeNames |> R.chain(typeNameToRegExp);

    return `${type.name}.${field.name}` |> R.anyPass(enableFields);
  };
};

const transformAccessToInputKinds = access => {
  return {
    R: [
      null, //base type
      INPUT_KINDS.WHERE,
      INPUT_KINDS.WHERE_UNIQUE,
      INPUT_KINDS.ORDER_BY,
      INPUT_KINDS.WHERE_INTERFACE,
      INPUT_KINDS.WHERE_UNIQUE_INTERFACE,
    ],
    C: [
      INPUT_KINDS.CREATE,
      INPUT_KINDS.CREATE_INTERFACE,
      INPUT_KINDS.CREATE_ONE_NESTED,
      INPUT_KINDS.CREATE_MANY_NESTED,
      INPUT_KINDS.CREATE_ONE_REQUIRED_NESTED,
      INPUT_KINDS.CREATE_MANY_REQUIRED_NESTED,
    ],

    U: [
      INPUT_KINDS.UPDATE,
      INPUT_KINDS.UPDATE_INTERFACE,
      INPUT_KINDS.UPDATE_ONE_NESTED,
      INPUT_KINDS.UPDATE_MANY_NESTED,
      INPUT_KINDS.UPDATE_ONE_REQUIRED_NESTED,
      INPUT_KINDS.UPDATE_MANY_REQUIRED_NESTED,
      INPUT_KINDS.UPDATE_WITH_WHERE_NESTED,
    ],
  }[access];
};

const kindToInputRegExp = R.curry((modelName, fieldName, inputKind) => {
  let inputName = inputKind
    ? getInputTypeName(inputKind, modelName)
    : modelName;
  return new RegExp(
    `^(?!Query|Mutation|Subscription)${inputName}\\.${fieldName}$`
  );
});

export const modelField = (modelName, fieldName, access) => {
  let enableFields =
    access
    |> R.split('')
    |> R.chain(transformAccessToInputKinds)
    |> R.map(kindToInputRegExp(modelName, fieldName))
    |> R.map(R.test);

  return ({ type, field }) => {
    let title = `${type.name}.${field.name}`;
    return title |> R.anyPass(enableFields);
  };
};

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

export const modelCustomActions = (modelName, actions) => {
  const modelNames = [modelName, pluralize(modelName)];
  const enableFields =
    modelNames
    |> R.chain(model =>
      actions.map(action => new RegExp(`^Mutation\\.${action}${model}$`))
    )
    |> R.map(R.test);

  return ({ type, field }) => {
    return `${type.name}.${field.name}` |> R.anyPass(enableFields);
  };
};

export const modelDefault = (modelName, fieldName, access, fn) => {
  return {
    cond: modelField(modelName, fieldName, access),
    fn,
  };
};
