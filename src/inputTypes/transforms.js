import _ from 'lodash';
import * as HANDLER from './handlers';
import {applyInputTransform} from './utils';
import {asyncForEach, asyncMapValues} from '~/utils';
import TypeWrap from '~/typeWrap';
import {UserInputError} from 'apollo-server';

export const flattenNested = params => {
  let fieldKey = _.head(_.keys(params));
  let value = params[fieldKey];
  let newValue = {};
  
  _.keys(value).forEach(key => {
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
  // return _.head(_.values(params));
};

export const validateAndTransformNestedInput = (type, isMany) => params => {
  let value = _.head(_.values(params));
  
  if (!isMany) {
    if (_.keys(value).length > 1) {
      throw new UserInputError(
        `You should not fill multiple fields in ${type.name} type`
      );
    }
  } else {
    if (value.delete && _.keys(value).length > 1) {
      throw new UserInputError(`Wrong input in ${type.name} type`);
    }
  }
  
  return _.mapValues(params, value => _.merge(..._.values(value)));
};

const validateAndTransformInterfaceValue = type => value => {
  if (_.keys(value).length > 1) {
    throw new UserInputError(
      `You should not fill multiple fields in ${type.name} type`
    );
  } else if (_.keys(value).length === 0) {
    return {};
    // throw new UserInputError(`You should fill any field in ${type.name} type`);
  }
  return _.head(_.values(value));
};
export const validateAndTransformInterfaceInput = type => params => {
  let func = validateAndTransformInterfaceValue(type);
  return _.mapValues(params, value => {
    if (_.isArray(value)) {
      return value.map(val => func(val));
    } else {
      return func(value);
    }
  });
};

export const transformModifier = modifier => params =>
  _(params)
    .mapValues(value => _mapModifier(modifier, value))
    .mapKeys((value, key) => {
      if (modifier != '') {
        return key.substring(key.length - modifier.length - 1, 0);
      } else {
        return key;
      }
    })
    .value();

function _mapModifier(modifier, value) {
  switch (modifier) {
    case '':
      return value;
    case 'not':
      return {$not: {$eq: value}};
    case 'lt':
    case 'lte':
    case 'gt':
    case 'gte':
      return {[`$${modifier}`]: value};
    case 'in':
    case 'some':
      return {$in: value};
    case 'every':
      return {$all: value};
    case 'none':
    case 'not_in':
      return {$nin: value};
    case 'contains':
      return `/.*${value}.*/`;
    case 'icontains':
      return `/.*${value}.*/i`;
    case 'not_contains':
      return {$not: `/.*${value}.*/`};
    case 'not_icontains':
      return {$not: `/.*${value}.*/i`};
    case 'starts_with':
      return `/${value}.*/`;
    case 'istarts_with':
      return `/${value}.*/i`;
    case 'not_starts_with':
      return {$not: `/${value}.*/`};
    case 'not_istarts_with':
      return {$not: `/${value}.*/i`};
    case 'ends_with':
      return `/.*${value}/`;
    case 'iends_with':
      return `/.*${value}/i`;
    case 'not_ends_with':
      return {$not: `/.*${value}/`};
    case 'not_iends_with':
      return {$not: `/.*${value}/i`};
    case 'exists':
      return {$exists: value};
    default:
      return {};
  }
}

export const applyNestedTransform = type => async params => {
  return await asyncMapValues(
    params,
    async value => await applyInputTransform(value, type)
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
  console.dir({message, params}, {depth: null});
  return params;
};
