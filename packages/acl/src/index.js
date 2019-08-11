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

import SchemaFilter from '@apollo-model/schema-filter';
const { transformSchema } = require('graphql-tools');
import R from 'ramda';

export const applyRules = (schema, allowRules = [], denyRules = []) => {
  let filterFields = SchemaFilter(
    (type, field) => {
      let allow = [type, field] |> R.anyPass(allowRules);
      let deny = [type, field] |> R.anyPass(denyRules);

      return allow && !deny;
    },
    (type, field) => {
      return () => null;
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

export const modelAccessRule = (modelName, access) => {
  let enableFields =
    access
    |> R.split('')
    |> R.map(transformAccessToMethodKinds)
    |> R.unnest
    |> R.map(kindToMethodRegExp(modelName))
    |> R.map(R.test);

  return ([type, field]) => {
    return `${type.name}.${field.name}` |> R.anyPass(enableFields);
  };
};

const transformAccessToInputKinds = access => {
  return {
    R: [
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
  let inputName = getInputTypeName(inputKind, modelName);
  return new RegExp(
    `^(?!Query|Mutation|Subscription)${inputName}\\.${fieldName}$`
  );
});

export const fieldAccessRule = (modelName, fieldName, access) => {
  // export const CREATE = 'create';
  // export const WHERE = 'where';
  // export const WHERE_UNIQUE = 'whereUnique';
  // export const UPDATE = 'update';
  // export const ORDER_BY = 'orderBy';
  // export const CREATE_INTERFACE = 'interfaceCreate';
  // export const WHERE_INTERFACE = 'interfaceWhere';
  // export const UPDATE_INTERFACE = 'interfaceUpdate';
  // export const WHERE_UNIQUE_INTERFACE = 'interfaceWhereUnique';
  // export const CREATE_ONE_NESTED = 'createOneNested';
  // export const CREATE_MANY_NESTED = 'createManyNested';
  // export const CREATE_ONE_REQUIRED_NESTED = 'createOneRequiredNested';
  // export const CREATE_MANY_REQUIRED_NESTED = 'createManyRequiredNested';
  //
  // export const UPDATE_ONE_NESTED = 'updateOneNested';
  // export const UPDATE_MANY_NESTED = 'updateManyNested';
  // export const UPDATE_ONE_REQUIRED_NESTED = 'updateOneRequiredNested';
  // export const UPDATE_MANY_REQUIRED_NESTED = 'updateManyRequiredNested';
  //
  // export const UPDATE_WITH_WHERE_NESTED = 'updateWithWhereNested';

  let enableFields =
    access
    |> R.split('')
    |> R.map(transformAccessToInputKinds)
    |> R.unnest
    |> R.map(kindToInputRegExp(modelName, fieldName))
    |> R.append(
      new RegExp(`^(?!Query|Mutation|Subscription)${modelName}\\.${fieldName}$`)
    )
    |> R.map(R.test);

  return ([type, field]) => {
    let title = `${type.name}.${field.name}`;
    return title |> R.anyPass(enableFields);
  };
};

export const operationAccessRule = regex => () => {};

export const regexAccessRule = regex => ([type, field]) =>
  regex.test(`${type.name}.${field.name}`);
