import {GraphQLList, GraphQLNonNull} from 'graphql';
import _ from 'lodash';

import {asyncForEach} from '../utils';

export const reduceTransforms = arr => async (params, context) => {
  await asyncForEach(arr, async func => {
    if (func) {
      params = await func(params, context);
    }
  });
  return params;
};

export const applyInputTransform = (context) => {
  return async (value, type) => {
    if (type instanceof GraphQLList) {
      return await Promise.all(
        value.map(val => applyInputTransform(context)(val, type.ofType))
      );
    } else if (type instanceof GraphQLNonNull) {
      return applyInputTransform(context)(value, type.ofType);
    }
    let fields = type._fields;
    if (!fields) return value;
    let result = {};
    await Promise.all(
      _.keys(fields).map(async key => {
        let field = fields[key];
        if (!field) {
          console.log('Key', key, 'fields', fields);
          throw 'Wrong type for input provided';
        }
        let val = value && value[key];
        //Apply mmTransformAlways
        if (field.mmTransformAlways) {
          _.toPairs(
            await field.mmTransformAlways(
              {
                [key]: val,
              },
              context
            )
          ).forEach(([k, v]) => (result[k] = v));
        }
        if (val !== undefined) {
          //Apply mmTransform or recurcively call applyInputTransform
          _.toPairs(
            field.mmTransform
              ? await field.mmTransform(
              {
                [key]: val,
              },
              context
              )
              : {
                [key]: await applyInputTransform(contex)(val, field.type),
              }
          ).forEach(([k, v]) => (result[k] = v));
        }
      })
    );
    return result;
  };
};

export function appendTransform(field, handler, functions) {
  if (!field[handler]) field[handler] = {};
  field[handler] = {...field[handler], ...functions};
}
