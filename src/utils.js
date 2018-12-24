import {
  GraphQLID,
  GraphQLString,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLBoolean,
  GraphQLFloat,
} from 'graphql';

import Scalars from './scalars';

import { combineResolvers as CombineResolvers } from 'graphql-resolvers';

import _ from 'lodash';
import pluralize from 'pluralize';

export const FIND = 'find';
export const FIND_ONE = 'findOne';
export const COUNT = 'count';
export const DISTINCT = 'distinct';
export const INSERT = 'insert';
export const REMOVE = 'remove';
export const UPDATE = 'update';

export function getInputType(name, Types) {
  if (!Types[name]) {
    let filterType = new GraphQLInputObjectType({
      name,
      fields: {},
    });
    filterType.getFields();
    Types[name] = filterType;
  }
  return Types[name];
}

export function getLastType(fieldType) {
  if (fieldType.ofType) {
    return getLastType(fieldType.ofType);
  }
  return fieldType;
}

export function getDirective(field, name) {
  if (field.astNode && field.astNode.directives) {
    return _.find(
      field.astNode.directives,
      directive => directive.name.value == name
    );
  }
  return undefined;
}

export function getDirectiveArg(directive, name, defaultValue) {
  let arg = _.find(
    directive.arguments,
    argument => argument.name.value == name
  );
  if (arg) return arg.value.value;
  else {
    return defaultValue;
  }
}

function camelize(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
      return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
    })
    .replace(/\s+/g, '');
}

export function getRelationFieldName(collection, field, many = false) {
  field = field.replace('_', '');
  if (many) {
    field = pluralize(field);
  }
  return camelize(`${collection} ${field}`);
}

export function hasQLListType(fieldType) {
  if (fieldType instanceof GraphQLList) {
    return true;
  }
  if (fieldType.ofType) {
    return hasQLListType(fieldType.ofType);
  }
  return false;
}

export function hasQLNonNullType(fieldType) {
  if (fieldType instanceof GraphQLNonNull) {
    return true;
  }
  if (fieldType.ofType) {
    return hasQLListType(fieldType.ofType);
  }
  return false;
}

export function cloneSchema(schema, type) {
  if (schema instanceof GraphQLNonNull) {
    return new GraphQLNonNull(cloneSchema(schema.ofType, type));
  }
  if (schema instanceof GraphQLList) {
    return new GraphQLList(cloneSchema(schema.ofType, type));
  }
  return type;
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export async function mapFiltersToSelector(filter, type) {
  let selector = {};
  await asyncForEach(_.keys(filter), async key => {
    if (type[key] && type[key].resolveMapFilterToSelector) {
      (await type[key].resolveMapFilterToSelector([
        {
          value: filter[key],
        },
      ])).forEach(({ fieldName, value }) => {
        // console.log({ fieldName, value });
        selector[fieldName] = value;
      });
    }
  });
  return selector;
}

export function allQueryArgs({ filterType, orderByType }) {
  return [
    {
      name: 'where',
      description: null,
      type: filterType,
      defaultValue: undefined,
    },
    {
      name: 'orderBy',
      description: null,
      type: orderByType,
      defaultValue: undefined,
    },
    {
      name: 'skip',
      description: null,
      type: GraphQLInt,
      defaultValue: undefined,
    },
    {
      name: 'first',
      description: null,
      type: GraphQLInt,
      defaultValue: undefined,
    },
  ];
}

export function GraphQLTypeFromString(type) {
  switch (type) {
    case 'ID':
      return GraphQLID;
    case 'Int':
      return GraphQLInt;
    case 'String':
      return GraphQLString;
    case 'ObjectID':
      return Scalars.ObjectID;
  }
}

export function combineResolvers(...args) {
  args = args.filter(arg => arg);
  return CombineResolvers(...args);
}

export function getInputTypeName(TypeName, inputType) {
  switch (inputType) {
    case 'where':
      return `${TypeName}WhereInput`;
    case 'orderBy':
      return `${TypeName}OrderByInput`;
  }
  return `${TypeName}Input`;
}

// export function isGraphQLScalarType(type) {
//   return [
//     GraphQLID,
//     GraphQLInt,
//     GraphQLFloat,
//     GraphQLString,
//     GraphQLBoolean,
//   ].includes(type);
// }
