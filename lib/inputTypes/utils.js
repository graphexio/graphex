"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.appendTransform = appendTransform;
exports.applyInputTransform = exports.reduceTransforms = void 0;

var _graphql = require("graphql");

var _lodash = _interopRequireDefault(require("lodash"));

var _utils = require("../utils");

const reduceTransforms = arr => async (params, context) => {
  await (0, _utils.asyncForEach)(arr, async func => {
    if (func) {
      params = await func(params, context);
    }
  });
  return params;
};

exports.reduceTransforms = reduceTransforms;

const applyInputTransform = context => {
  return async (value, type) => {
    if (type instanceof _graphql.GraphQLList) {
      return await Promise.all(value.map(val => applyInputTransform(context)(val, type.ofType)));
    } else if (type instanceof _graphql.GraphQLNonNull) {
      return applyInputTransform(context)(value, type.ofType);
    }

    let fields = type._fields;
    if (!fields) return value;
    let result = {};
    await Promise.all(Object.keys(fields).map(async key => {
      let field = fields[key];

      if (!field) {
        console.log('Key', key, 'fields', fields);
        throw 'Wrong type for input provided';
      }

      let val = value && value[key]; //Apply mmTransformAlways

      if (field.mmTransformAlways) {
        _lodash.default.toPairs((await field.mmTransformAlways({
          [key]: val
        }, context))).forEach(([k, v]) => result[k] = v);
      }

      if (val !== undefined) {
        //Apply mmTransform or recursively call applyInputTransform
        _lodash.default.toPairs(field.mmTransform ? await field.mmTransform({
          [key]: val
        }, context) : {
          [key]: await applyInputTransform(context)(val, field.type)
        }).forEach(([k, v]) => result[k] = shouldMerge(v) ? _lodash.default.merge(result[k], v) : v);
      }
    }));
    return result;
  };
};

exports.applyInputTransform = applyInputTransform;

function shouldMerge(v) {
  return _lodash.default.isObject(v) && !Array.isArray(v) && !v instanceof Date;
}

function appendTransform(field, handler, functions) {
  if (!field[handler]) field[handler] = {};
  field[handler] = { ...field[handler],
    ...functions
  };
}