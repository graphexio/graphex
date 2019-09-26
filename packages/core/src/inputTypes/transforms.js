import _ from 'lodash';
import * as HANDLER from './handlers';
import { applyInputTransform } from './utils';
import { asyncMapValues } from '../utils';
import { UserInputError } from 'apollo-server';

// const r = (value) => new RegExp(value);
const r = (value, options) => {
  return { $regex: new RegExp(value, options) };
};

export const flattenNested = params => {
  let fieldKey = _.head(Object.keys(params));
  let value = params[fieldKey];
  let newValue = {};

  Object.keys(value).forEach(key => {
    let val = value[key];
    //don't flatten modifiers
    if (key.startsWith('$mm')) {
      if (!newValue[fieldKey]) newValue[fieldKey] = {};
      newValue[fieldKey][key] = val;
    } else {
      newValue[`${fieldKey}.${key}`] = val;
    }
  });
  return newValue;
  // params = _.mapValues(params, async (value, fieldKey) => {
  //   value = _.mapKeys(value, (value, key) => {
  //     return `${fieldKey}.${key}`;
  //   });
  //   return value;
  // });
  // return _.head(Object.values(params));
};

export const validateAndTransformNestedInput = (type, isMany) => params => {
  let value = _.head(Object.values(params));
  if (Object.keys(value).length === 0) {
    throw new UserInputError(`You should fill any field in ${type.name} type`);
  }

  if (!isMany) {
    if (Object.keys(value).length > 1) {
      throw new UserInputError(
        `You should not fill multiple fields in ${type.name} type`
      );
    }
  } else {
    if (value.delete && Object.keys(value).length > 1) {
      throw new UserInputError(`Wrong input in ${type.name} type`);
    }
  }

  return _.mapValues(params, value => _.merge(...Object.values(value)));
};

const validateAndTransformInterfaceValue = type => value => {
  if (Object.keys(value).length > 1) {
    throw new UserInputError(
      `You should not fill multiple fields in ${type.name} type`
    );
  } else if (Object.keys(value).length === 0) {
    return {};
    // throw new UserInputError(`You should fill any field in ${type.name} type`);
  }
  return _.head(Object.values(value));
};
export const validateAndTransformInterfaceInput = type => params => {
  let func = validateAndTransformInterfaceValue(type);
  return _.mapValues(params, value => {
    if (Array.isArray(value)) {
      return value.map(val => func(val));
    } else {
      return func(value);
    }
  });
};

export const applyNestedTransform = type => async (params, context) => {
  return await asyncMapValues(
    params,
    async value => await applyInputTransform(context)(value, type)
  );
};

export const fieldInputTransform = (field = {}, kind) => async params => {
  if (
    field[HANDLER.TRANSFORM_INPUT] &&
    _.isFunction(field[HANDLER.TRANSFORM_INPUT][kind])
  ) {
    return field[HANDLER.TRANSFORM_INPUT][kind](params);
  }
  return params;
};

export const log = message => params => {
  console.dir({ message, params }, { depth: null });
  return params;
};
