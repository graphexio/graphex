"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.log = exports.fieldInputTransform = exports.applyNestedTransform = exports.transformModifier = exports.validateAndTransformInterfaceInput = exports.validateAndTransformNestedInput = exports.flattenNested = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _lodash = _interopRequireDefault(require("lodash"));

var HANDLER = _interopRequireWildcard(require("./handlers"));

var _utils = require("./utils");

var _utils2 = require("../utils");

var _typeWrap = _interopRequireDefault(require("../typeWrap"));

var _apolloServer = require("apollo-server");

var r = function r(value) {
  return new RegExp(value);
}; // const r = (value) => {
//   return {$regex: new RegExp(value)}
// };


var flattenNested = function flattenNested(params) {
  var fieldKey = _lodash.default.head(_lodash.default.keys(params));

  var value = params[fieldKey];
  var newValue = {};

  _lodash.default.keys(value).forEach(function (key) {
    var val = value[key]; //don't flatten modifiers

    if (key.startsWith('$mm')) {
      if (!newValue[fieldKey]) newValue[fieldKey] = {};
      newValue[fieldKey][key] = val;
    } else {
      newValue["".concat(fieldKey, ".").concat(key)] = val;
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

var validateAndTransformNestedInput = function validateAndTransformNestedInput(type, isMany) {
  return function (params) {
    var value = _lodash.default.head(_lodash.default.values(params));

    if (!isMany) {
      if (_lodash.default.keys(value).length > 1) {
        throw new _apolloServer.UserInputError("You should not fill multiple fields in ".concat(type.name, " type"));
      }
    } else {
      if (value.delete && _lodash.default.keys(value).length > 1) {
        throw new _apolloServer.UserInputError("Wrong input in ".concat(type.name, " type"));
      }
    }

    return _lodash.default.mapValues(params, function (value) {
      return _lodash.default.merge.apply(_lodash.default, (0, _toConsumableArray2.default)(_lodash.default.values(value)));
    });
  };
};

exports.validateAndTransformNestedInput = validateAndTransformNestedInput;

var validateAndTransformInterfaceValue = function validateAndTransformInterfaceValue(type) {
  return function (value) {
    if (_lodash.default.keys(value).length > 1) {
      throw new _apolloServer.UserInputError("You should not fill multiple fields in ".concat(type.name, " type"));
    } else if (_lodash.default.keys(value).length === 0) {
      return {}; // throw new UserInputError(`You should fill any field in ${type.name} type`);
    }

    return _lodash.default.head(_lodash.default.values(value));
  };
};

var validateAndTransformInterfaceInput = function validateAndTransformInterfaceInput(type) {
  return function (params) {
    var func = validateAndTransformInterfaceValue(type);
    return _lodash.default.mapValues(params, function (value) {
      if (_lodash.default.isArray(value)) {
        return value.map(function (val) {
          return func(val);
        });
      } else {
        return func(value);
      }
    });
  };
};

exports.validateAndTransformInterfaceInput = validateAndTransformInterfaceInput;

var transformModifier = function transformModifier(modifier) {
  return function (params) {
    return (0, _lodash.default)(params).mapValues(function (value) {
      return _mapModifier(modifier, value);
    }).mapKeys(function (value, key) {
      if (modifier !== '') {
        return key.substring(key.length - modifier.length - 1, 0);
      } else {
        return key;
      }
    }).value();
  };
};

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
      return (0, _defineProperty2.default)({}, "$".concat(modifier), value);

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
      return r("/.*".concat(value, ".*/"));

    case 'icontains':
      return r("/.*".concat(value, ".*/i"));

    case 'not_contains':
      return {
        $not: r("/.*".concat(value, ".*/"))
      };

    case 'not_icontains':
      return {
        $not: r("/.*".concat(value, ".*/i"))
      };

    case 'starts_with':
      return r("/".concat(value, ".*/"));

    case 'istarts_with':
      return r("/".concat(value, ".*/i"));

    case 'not_starts_with':
      return {
        $not: r("/".concat(value, ".*/"))
      };

    case 'not_istarts_with':
      return {
        $not: r("/".concat(value, ".*/i"))
      };

    case 'ends_with':
      return r("/.*".concat(value, "/"));

    case 'iends_with':
      return r("/.*".concat(value, "/i"));

    case 'not_ends_with':
      return {
        $not: r("/.*".concat(value, "/"))
      };

    case 'not_iends_with':
      return {
        $not: r("/.*".concat(value, "/i"))
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

var applyNestedTransform = function applyNestedTransform(type) {
  return (
    /*#__PURE__*/
    function () {
      var _ref2 = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee2(params) {
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return (0, _utils2.asyncMapValues)(params,
                /*#__PURE__*/
                function () {
                  var _ref3 = (0, _asyncToGenerator2.default)(
                  /*#__PURE__*/
                  _regenerator.default.mark(function _callee(value) {
                    return _regenerator.default.wrap(function _callee$(_context) {
                      while (1) {
                        switch (_context.prev = _context.next) {
                          case 0:
                            _context.next = 2;
                            return (0, _utils.applyInputTransform)(value, type);

                          case 2:
                            return _context.abrupt("return", _context.sent);

                          case 3:
                          case "end":
                            return _context.stop();
                        }
                      }
                    }, _callee, this);
                  }));

                  return function (_x2) {
                    return _ref3.apply(this, arguments);
                  };
                }());

              case 2:
                return _context2.abrupt("return", _context2.sent);

              case 3:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      return function (_x) {
        return _ref2.apply(this, arguments);
      };
    }()
  );
};

exports.applyNestedTransform = applyNestedTransform;

var fieldInputTransform = function fieldInputTransform() {
  var field = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var kind = arguments.length > 1 ? arguments[1] : undefined;
  return (
    /*#__PURE__*/
    function () {
      var _ref4 = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee3(params) {
        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!(field[HANDLER.TRANSFORM_INPUT] && _lodash.default.isFunction(field[HANDLER.TRANSFORM_INPUT][kind]))) {
                  _context3.next = 2;
                  break;
                }

                return _context3.abrupt("return", field[HANDLER.TRANSFORM_INPUT][kind](params));

              case 2:
                return _context3.abrupt("return", params);

              case 3:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      return function (_x3) {
        return _ref4.apply(this, arguments);
      };
    }()
  );
};

exports.fieldInputTransform = fieldInputTransform;

var log = function log(message) {
  return function (params) {
    console.dir({
      message: message,
      params: params
    }, {
      depth: null
    });
    return params;
  };
};

exports.log = log;