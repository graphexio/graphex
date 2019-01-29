import { GraphQLList, GraphQLNonNull } from 'graphql';
import _ from 'lodash';

import { asyncForEach } from '../utils';

export const reduceTransforms = arr => async (params, context) => {
  await asyncForEach(arr, async func => {
    if (func) {
      params = await func(params, context);
    }
  });
  return params;
};

export const applyAlwaysInputTransform = context => async (
  modelType,
  args,
  kind
) => {
  let data = { ...args };
  await asyncForEach(
    Object.entries(modelType._fields),
    async ([fieldName, field]) => {
      if (field.mmTransformAlways && field.mmTransformAlways.includes(kind)) {
        if (field.mmTransformInput || field.mmTransformInput[kind]) {
          let transform = field.mmTransformInput[kind];
          data = {
            ...data,
            ...(await transform(
              { [fieldName]: data[fieldName] || null },
              context
            )),
          };
        }
      }
    }
  );
  return data;
};

export const applyInputTransform = context => {
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
      _.keys(value).map(async key => {
        let field = fields[key];
        if (!field) {
          console.log('Key', key, 'fields', fields);
          throw 'Wrong type for input provided';
        }
        let val = value[key];
        result = {
          ...result,
          ...(field.mmTransform
            ? await field.mmTransform(
                {
                  [key]: val,
                },
                context
              )
            : {
                [key]: await applyInputTransform(context)(val, field.type),
              }),
        };
      })
    );
    return result;
  };
};

export function appendTransform(field, handler, functions) {
  if (!field[handler]) field[handler] = {};
  field[handler] = { ...field[handler], ...functions };
}
