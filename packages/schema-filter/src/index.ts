import {
  createResolveType,
  fieldMapToFieldConfigMap,
  inputFieldMapToFieldConfigMap,
} from '@apollo-model/graphql-tools/dist/stitching/schemaRecreation';
import {
  visitSchema,
  VisitSchemaKind,
} from '@apollo-model/graphql-tools/dist/transforms/visitSchema';
import TypeWrap from '@apollo-model/type-wrap';
import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  isInputObjectType,
  isObjectType,
  Kind,
  // visit,
  isScalarType,
  getNamedType,
  GraphQLList,
  typeFromAST,
  GraphQLNamedType,
  GraphQLSchema,
} from 'graphql';

import { Transform } from '@apollo-model/graphql-tools';

import * as R from 'ramda';
import DefaultFields from './defaultFields';
import { astFromValue } from '@apollo-model/ast-from-value';
import { visit } from './visitor';

import { transformRequest } from './transformRequest';
import { transformSchema } from './transformSchema';

const capitalizeFirstLetter = string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const reduceArgs = (map, arg) => {
  map[arg.name] = arg;
  return map;
};

const getFields = stackItem => stackItem.type.getFields();
const getArgs = stackItem => stackItem.args;

const getNameValue = node => node.name.value;
const getFragmentTypeName = node => node.typeCondition.name.value;

const mapTypeForTypeStack = type => ({ type });

export const mapFieldForTypeStack = field => ({
  type: new TypeWrap(field.type).realType(),
  args: field.args.reduce(reduceArgs, {}),
});

const mapArgForTypeStack = arg => ({
  type: new TypeWrap(arg.type).realType(),
});

export const groupFields = (predicate, object) => {
  let result = {};
  for (let key in object) {
    let predicateValue = predicate(object[key]);
    if (!result[predicateValue]) result[predicateValue] = {};
    result[predicateValue][key] = object[key];
  }
  return result;
};

export const reduceValues = values => {
  return values.reduce((state, item) => {
    state[item.name] = R.omit(['deprecationReason', 'isDeprecated'], item);
    return state;
  }, {});
};

const resolveType = createResolveType((typeName, type) => {
  return type;
});

export const SchemaFilter: (transformOptions: {
  filterFields;
  defaultFields;
  defaultArgs;
}) => Transform = transformOptions => {
  const transformContext: {
    initialSchema?: GraphQLSchema;
    defaults?: any;
  } = {};

  return {
    transformSchema: transformSchema(transformOptions, transformContext),
    transformRequest: transformRequest(transformOptions, transformContext),
  };
};
