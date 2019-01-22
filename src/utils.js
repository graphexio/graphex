import {
  GraphQLID,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull
} from 'graphql';

import Scalars from './scalars';

import {combineResolvers as CombineResolvers} from 'graphql-resolvers';

import _ from 'lodash';
import pluralize from 'pluralize';

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
      directive => directive.name.value === name
    );
  }
  return undefined;
}

export function getDirectiveArg(directive, name, defaultValue) {
  let arg = _.find(
    directive.arguments,
    argument => argument.name.value === name
  );
  if (arg) return arg.value.value;
  else {
    return defaultValue;
  }
}

function camelize(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (letter, index) {
      return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
    })
    .replace(/\s+/g, '');
}

export function lowercaseFirstLetter(string) {
  if (string instanceof String) {
    return string.charAt(0).toLowerCase() + string.slice(1);
  }
  return string;
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

export function cloneSchemaOptional(schema, type) {
  if (schema instanceof GraphQLNonNull) {
    return cloneSchema(schema.ofType, type);
  }
  if (schema instanceof GraphQLList) {
    return new GraphQLList(cloneSchema(schema.ofType, type));
  }
  return type;
}

export async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export async function asyncMapValues(object, callback) {
  let newObject = {};
  await asyncForEach(_.keys(object), async key => {
    let value = object[key];
    newObject[key] = await callback(value, key, object);
  });
  return newObject;
}

export function allQueryArgs({whereType, orderByType}) {
  return [
    {
      name: 'where',
      description: null,
      type: whereType,
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

export function prepareUpdateDoc(doc) {
  doc = _.cloneDeep(doc);
  console.log({doc});
  
  let set = {};
  let unset = {};
  let push = {};
  let pull = {};
  let pullAll = {};
  let arrayFilters = [];
  let validations = {};
  
  _.keys(doc).forEach(path => {
    let value = doc[path];
    _.keys(value).forEach(key => {
      let val = value[key];
      switch (key) {
        case '$mmPushAll':
          push[path] = {$each: val};
          delete value[key];
          break;
        case '$mmArrayFilter':
          arrayFilters.push(val);
          delete value[key];
          break;
        case '$mmPull':
          pull[path] = val;
          delete value[key];
          break;
        case '$mmPullAll':
          pullAll[path] = val;
          delete value[key];
          break;
        case '$mmUnset':
          unset[path] = true;
          delete value[key];
          break;
        case '$mmExists':
          validations[path] = {$exists: val};
          delete value[key];
          break;
        case '$mmEquals':
          validations[path] = {$equals: val};
          delete value[key];
          break;
      }
    });
    if (!_.isObject(value) || _.keys(value).length > 0) {
      set[path] = value;
    }
  });
  let newDoc = {};
  if (!_.isEmpty(set)) {
    newDoc.$set = set;
  }
  if (!_.isEmpty(unset)) {
    newDoc.$unset = unset;
  }
  if (!_.isEmpty(push)) {
    newDoc.$push = push;
  }
  if (!_.isEmpty(pull)) {
    newDoc.$pull = pull;
  }
  if (!_.isEmpty(pullAll)) {
    newDoc.$pullAll = pullAll;
  }
  
  // console.log(newDoc);
  // console.log({ validations });
  // console.log({ arrayFilters });
  return {doc: newDoc, validations, arrayFilters};
}
