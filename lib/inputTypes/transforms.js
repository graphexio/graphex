"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.log = exports.fieldInputTransform = exports.applyNestedTransform = exports.transformModifier = exports.validateAndTransformInterfaceInput = exports.validateAndTransformNestedInput = exports.flattenNested = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

var HANDLER = _interopRequireWildcard(require("./handlers"));

var _utils = require("./utils");

var _utils2 = require("../utils");

var _apolloServer = require("apollo-server");

// const r = (value) => new RegExp(value);
const r = (value, options) => {
  return {
    $regex: new RegExp(value, options)
  };
};

const flattenNested = params => {
  let fieldKey = _lodash.default.head(_lodash.default.keys(params));

  let value = params[fieldKey];
  let newValue = {};

  _lodash.default.keys(value).forEach(key => {
    let val = value[key]; //don't flatten modifiers

    if (key.startsWith('$mm')) {
      if (!newValue[fieldKey]) newValue[fieldKey] = {};
      newValue[fieldKey][key] = val;
    } else {
      newValue[`${fieldKey}.${key}`] = val;
    }
  });

  return newValue; // params = _.mapValues(params, async (value, fieldKey) => {
  //   value = _.mapKeys(value, (value, key) => {
  //     return `${fieldKey}.${key}`;
  //   });
  //   return value;
  // });
  // return _.head(_.values(params));
};

exports.flattenNested = flattenNested;

const validateAndTransformNestedInput = (type, isMany) => params => {
  let value = _lodash.default.head(_lodash.default.values(params));

  if (!isMany) {
    if (_lodash.default.keys(value).length > 1) {
      throw new _apolloServer.UserInputError(`You should not fill multiple fields in ${type.name} type`);
    }
  } else {
    if (value.delete && _lodash.default.keys(value).length > 1) {
      throw new _apolloServer.UserInputError(`Wrong input in ${type.name} type`);
    }
  }

  return _lodash.default.mapValues(params, value => _lodash.default.merge(..._lodash.default.values(value)));
};

exports.validateAndTransformNestedInput = validateAndTransformNestedInput;

const validateAndTransformInterfaceValue = type => value => {
  if (_lodash.default.keys(value).length > 1) {
    throw new _apolloServer.UserInputError(`You should not fill multiple fields in ${type.name} type`);
  } else if (_lodash.default.keys(value).length === 0) {
    return {}; // throw new UserInputError(`You should fill any field in ${type.name} type`);
  }

  return _lodash.default.head(_lodash.default.values(value));
};

const validateAndTransformInterfaceInput = type => params => {
  let func = validateAndTransformInterfaceValue(type);
  return _lodash.default.mapValues(params, value => {
    if (_lodash.default.isArray(value)) {
      return value.map(val => func(val));
    } else {
      return func(value);
    }
  });
};

exports.validateAndTransformInterfaceInput = validateAndTransformInterfaceInput;

const transformModifier = modifier => params => (0, _lodash.default)(params).mapValues(value => _mapModifier(modifier, value)).mapKeys((value, key) => {
  if (modifier !== '') {
    return key.substring(key.length - modifier.length - 1, 0);
  } else {
    return key;
  }
}).value();

exports.transformModifier = transformModifier;

function _mapModifier(modifier, value) {
  switch (modifier) {
    case '':
      return value;

    case 'not':
      return {
        $not: {
          $eq: value
        }
      };

    case 'lt':
    case 'lte':
    case 'gt':
    case 'gte':
      return {
        [`$${modifier}`]: value
      };

    case 'in':
    case 'some':
      return {
        $in: value
      };

    case 'every':
      return {
        $all: value
      };

    case 'none':
    case 'not_in':
      return {
        $nin: value
      };

    case 'contains':
      return r(value);

    case 'icontains':
      return r(value, "i");

    case 'not_contains':
      return {
        $not: r(value)
      };

    case 'not_icontains':
      return {
        $not: r(value, "i")
      };

    case 'starts_with':
      return r(`^${value}`);

    case 'istarts_with':
      return r(`^${value}`, "i");

    case 'not_starts_with':
      return {
        $not: r(`^${value}`)
      };

    case 'not_istarts_with':
      return {
        $not: r(`^${value}`, "i")
      };

    case 'ends_with':
      return r(`${value}$`);

    case 'iends_with':
      return r(`${value}$`, "i");

    case 'not_ends_with':
      return {
        $not: r(`${value}$`)
      };

    case 'not_iends_with':
      return {
        $not: r(`${value}$`, "i")
      };

    case 'exists':
      return {
        $exists: value
      };

    case 'size':
      return {
        $size: value
      };

    case 'not_size':
      return {
        $not: {
          $size: value
        }
      };

    default:
      return {};
  }
}

const applyNestedTransform = type => async (params, context) => {
  return await (0, _utils2.asyncMapValues)(params, async value => await (0, _utils.applyInputTransform)(context)(value, type));
};

exports.applyNestedTransform = applyNestedTransform;

const fieldInputTransform = (field = {}, kind) => async params => {
  if (field[HANDLER.TRANSFORM_INPUT] && _lodash.default.isFunction(field[HANDLER.TRANSFORM_INPUT][kind])) {
    return field[HANDLER.TRANSFORM_INPUT][kind](params);
  }

  return params;
};

exports.fieldInputTransform = fieldInputTransform;

const log = message => params => {
  console.dir({
    message,
    params
  }, {
    depth: null
  });
  return params;
};

exports.log = log;