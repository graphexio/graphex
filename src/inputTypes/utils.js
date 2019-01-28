import {
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql';
import _ from 'lodash';

import { asyncForEach, asyncMapValues } from '../utils';

export const reduceTransforms = arr => async params => {
  await asyncForEach(arr, async func => {
    if (func) {
      params = await func(params);
    }
  });
  return params;
};

export async function applyInputTransform(value, type, info) {
  if (type instanceof GraphQLList) {
    return await Promise.all(
      value.map(val => applyInputTransform(val, type.ofType, info))
    );
  } else if (type instanceof GraphQLNonNull) {
    return applyInputTransform(value, type.ofType, info);
  }

  let fields = type._fields;
  if (!fields) return value;
  let result = {};
  await asyncForEach(_.keys(value), async key => {
    let field = fields[key];
    if (!field) {
        throw 'Wrong type for input provided';
    }
    let val = value[key];
    result = {
      ...result,
      ...(field.mmTransform
        ? await field.mmTransform({
            [key]: val,
          }, info)
        : {
            [key]: await applyInputTransform(val, field.type, info),
          }),
    };
  });
  await asyncForEach(_.keys(fields), async fieldName => {
  
  });
  return result;
}

export function appendTransform(field, handler, functions) {
  if (!field[handler]) field[handler] = {};
  field[handler] = { ...field[handler], ...functions };
}
