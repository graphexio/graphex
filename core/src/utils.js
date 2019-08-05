import {
  GraphQLID,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql';

import { combineResolvers as CombineResolvers } from 'graphql-resolvers';

import _ from 'lodash';
import pluralize from 'pluralize';
import { DELETE_ONE, INSERT_ONE, UPDATE_ONE } from './queryExecutor';

export function getLastType(fieldType) {
  if (fieldType.ofType) {
    return getLastType(fieldType.ofType);
  }
  return fieldType;
}

export function getDirective(field, name) {
  if (field.astNode && field.astNode.directives) {
    return field.astNode.directives.find(
      directive => directive.name.value === name
    );
  }
  return undefined;
}

export function getDirectiveArg(directive, name, defaultValue) {
  let arg = directive.arguments.find(argument => argument.name.value === name);
  if (arg) return arg.value.value;
  else {
    return defaultValue;
  }
}

function camelize(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
      return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
    })
    .replace(/\s+/g, '');
}

export function lowercaseFirstLetter(string) {
  if (typeof string === 'string') {
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
  await asyncForEach(Object.keys(object), async key => {
    let value = object[key];
    newObject[key] = await callback(value, key, object);
  });
  return newObject;
}

export function allQueryArgs({ whereType, orderByType }) {
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
//
// export function GraphQLTypeFromString(type) {
//   switch (type) {
//     case 'ID':
//       return GraphQLID;
//     case 'Int':
//       return GraphQLInt;
//     case 'String':
//       return GraphQLString;
//     case 'ObjectID':
//       return Scalars.ObjectID;
//   }
// }

export function combineResolvers(...args) {
  args = args.filter(arg => arg);
  return CombineResolvers(...args);
}

function checkForModifiers(value) {
  return (
    _.isObject(value) &&
    value instanceof Date === false &&
    !Array.isArray(value)
  );
}

function isSet(value) {
  return (
    Array.isArray(value) ||
    value instanceof Date === true ||
    !_.isObject(value) ||
    Object.keys(value).length > 0
  );
}

export function prepareUpdateDoc(doc) {
  doc = _.cloneDeep(doc);
  // console.log({doc});

  let set = {};
  let unset = {};
  let push = {};
  let pull = {};
  let pullAll = {};
  let arrayFilters = [];
  let validations = {};
  let postResolvers = {};

  Object.keys(doc).forEach(path => {
    let value = doc[path];
    if (checkForModifiers(value)) {
      Object.keys(value).forEach(key => {
        let val = value[key];
        let resolve;
        switch (key) {
          case '$mmPushAll':
            push[path] = { $each: val };
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
            validations[path] = { $exists: val };
            delete value[key];
            break;
          case '$mmEquals':
            validations[path] = { $equals: val };
            delete value[key];
            break;
          case '$mmDeleteSingleRelation':
            resolve = {
              fieldName: path,
              ...val,
            };
            postResolvers[DELETE_ONE]
              ? postResolvers[DELETE_ONE].push(resolve)
              : (postResolvers[DELETE_ONE] = [resolve]);
            delete value[key];
            break;
          case '$mmConnectExtRealtion':
            resolve = {
              fieldName: path,
              ...val,
            };
            postResolvers[UPDATE_ONE]
              ? postResolvers[UPDATE_ONE].push(resolve)
              : (postResolvers[UPDATE_ONE] = [resolve]);
            break;
          case '$mmDisconnectExtRelation':
            resolve = {
              fieldName: path,
              ...val,
            };
            postResolvers[UPDATE_ONE]
              ? postResolvers[UPDATE_ONE].push(resolve)
              : (postResolvers[UPDATE_ONE] = [resolve]);
            break;
          case '$mmCreateExtRealtion':
            resolve = {
              fieldName: path,
              ...val,
            };
            postResolvers[INSERT_ONE]
              ? postResolvers[INSERT_ONE].push(resolve)
              : (postResolvers[INSERT_ONE] = [resolve]);
            break;
          case '$mmDeleteExtRelation':
            resolve = {
              fieldName: path,
              ...val,
            };
            postResolvers[DELETE_ONE]
              ? postResolvers[DELETE_ONE].push(resolve)
              : (postResolvers[DELETE_ONE] = [resolve]);
            break;
        }
      });
    }
    if (isSet(value)) {
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
  return { doc: newDoc, validations, arrayFilters, postResolvers };
}
