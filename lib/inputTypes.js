"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.appendTransform = appendTransform;
exports.applyInputTransform = applyInputTransform;
exports.reduceTransforms = exports.default = exports.TRANSFORM_INPUT = exports.TRANSFORM_TO_INPUT = exports.INPUT_UPDATE_MANY_REQUIRED_NESTED = exports.INPUT_UPDATE_ONE_REQUIRED_NESTED = exports.INPUT_UPDATE_MANY_NESTED = exports.INPUT_UPDATE_ONE_NESTED = exports.INPUT_CREATE_MANY_REQUIRED_NESTED = exports.INPUT_CREATE_ONE_REQUIRED_NESTED = exports.INPUT_CREATE_MANY_NESTED = exports.INPUT_CREATE_ONE_NESTED = exports.INPUT_WHERE_UNIQUE_INTERFACE = exports.INPUT_UPDATE_INTERFACE = exports.INPUT_WHERE_INTERFACE = exports.INPUT_CREATE_INTERFACE = exports.INPUT_ORDER_BY = exports.INPUT_UPDATE = exports.INPUT_WHERE_UNIQUE = exports.INPUT_WHERE = exports.INPUT_CREATE = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _lodash = _interopRequireDefault(require("lodash"));

var _graphql = require("graphql");

var _utils = require("./utils");

var Modifiers = {
  Boolean: ['', 'not', 'exists'],
  ID: ['', 'in', 'not_in', 'exists'],
  ObjectID: ['', 'in', 'not_in', 'exists'],
  Int: ['', 'in', 'not_in', 'lt', 'lte', 'gt', 'gte', 'exists'],
  Float: ['', 'in', 'not_in', 'lt', 'lte', 'gt', 'gte', 'exists'],
  String: ['', 'not', 'in', 'not_in', 'lt', 'lte', 'gt', 'gte', 'contains', 'not_contains', 'starts_with', 'not_starts_with', 'ends_with', 'not_ends_with', 'exists']
};
var INPUT_CREATE = 'create';
exports.INPUT_CREATE = INPUT_CREATE;
var INPUT_WHERE = 'where';
exports.INPUT_WHERE = INPUT_WHERE;
var INPUT_WHERE_UNIQUE = 'whereUnique';
exports.INPUT_WHERE_UNIQUE = INPUT_WHERE_UNIQUE;
var INPUT_UPDATE = 'update';
exports.INPUT_UPDATE = INPUT_UPDATE;
var INPUT_ORDER_BY = 'orderBy';
exports.INPUT_ORDER_BY = INPUT_ORDER_BY;
var INPUT_CREATE_INTERFACE = 'interfaceCreate';
exports.INPUT_CREATE_INTERFACE = INPUT_CREATE_INTERFACE;
var INPUT_WHERE_INTERFACE = 'interfaceWhere';
exports.INPUT_WHERE_INTERFACE = INPUT_WHERE_INTERFACE;
var INPUT_UPDATE_INTERFACE = 'interfaceUpdate';
exports.INPUT_UPDATE_INTERFACE = INPUT_UPDATE_INTERFACE;
var INPUT_WHERE_UNIQUE_INTERFACE = 'interfaceWhereUnique'; // export const INPUT_UPDATE_INHERIT = 'inheritUpdate';

exports.INPUT_WHERE_UNIQUE_INTERFACE = INPUT_WHERE_UNIQUE_INTERFACE;
var INPUT_CREATE_ONE_NESTED = 'createOneNested';
exports.INPUT_CREATE_ONE_NESTED = INPUT_CREATE_ONE_NESTED;
var INPUT_CREATE_MANY_NESTED = 'createManyNested';
exports.INPUT_CREATE_MANY_NESTED = INPUT_CREATE_MANY_NESTED;
var INPUT_CREATE_ONE_REQUIRED_NESTED = 'createOneRequiredNested';
exports.INPUT_CREATE_ONE_REQUIRED_NESTED = INPUT_CREATE_ONE_REQUIRED_NESTED;
var INPUT_CREATE_MANY_REQUIRED_NESTED = 'createManyRequiredNested';
exports.INPUT_CREATE_MANY_REQUIRED_NESTED = INPUT_CREATE_MANY_REQUIRED_NESTED;
var INPUT_UPDATE_ONE_NESTED = 'updateOneNested';
exports.INPUT_UPDATE_ONE_NESTED = INPUT_UPDATE_ONE_NESTED;
var INPUT_UPDATE_MANY_NESTED = 'updateManyNested';
exports.INPUT_UPDATE_MANY_NESTED = INPUT_UPDATE_MANY_NESTED;
var INPUT_UPDATE_ONE_REQUIRED_NESTED = 'updateOneRequiredNested';
exports.INPUT_UPDATE_ONE_REQUIRED_NESTED = INPUT_UPDATE_ONE_REQUIRED_NESTED;
var INPUT_UPDATE_MANY_REQUIRED_NESTED = 'updateManyRequiredNested'; // export const INPUT_UPDATE_ONE_NESTED = 'updateOneNested';
// export const INPUT_UPDATE_MANY_NESTED = 'updateManyNested';

exports.INPUT_UPDATE_MANY_REQUIRED_NESTED = INPUT_UPDATE_MANY_REQUIRED_NESTED;
var TRANSFORM_TO_INPUT = 'mmTransformToInput';
exports.TRANSFORM_TO_INPUT = TRANSFORM_TO_INPUT;
var TRANSFORM_INPUT = 'mmTransformInput';
exports.TRANSFORM_INPUT = TRANSFORM_INPUT;

var InputTypes = function InputTypes(_ref) {
  var _this = this,
      _this$_defaultTransfo;

  var SchemaTypes = _ref.SchemaTypes;
  (0, _classCallCheck2.default)(this, InputTypes);
  (0, _defineProperty2.default)(this, "Kinds", []);
  (0, _defineProperty2.default)(this, "_defaultTransformToInputOrderBy", function (field) {
    return [{
      name: "".concat(field.name, "_ASC"),
      value: (0, _defineProperty2.default)({}, field.name, 1)
    }, {
      name: "".concat(field.name, "_DESC"),
      value: (0, _defineProperty2.default)({}, field.name, -1)
    }];
  });
  (0, _defineProperty2.default)(this, "_defaultTransformToInputUpdate", function (field) {
    var lastType = (0, _utils.getLastType)(field.type);
    var isMany = (0, _utils.hasQLListType)(field.type);
    var isNested = false;
    var isInterface = false;

    if (lastType instanceof _graphql.GraphQLInterfaceType) {
      isNested = true;
      isInterface = true;
    }

    if (lastType instanceof _graphql.GraphQLObjectType) {
      isNested = true;
    }

    var newFieldType = lastType;
    var type;

    if (isNested) {
      newFieldType = _this._inputType(lastType, isMany ? INPUT_UPDATE_MANY_NESTED : INPUT_UPDATE_ONE_NESTED);
      type = newFieldType;
    } else {
      type = (0, _utils.cloneSchemaOptional)(field.type, newFieldType);
    } // const { mmTransformInput = {} } = field;
    // let transformFunc = mmTransformInput[INPUT_UPDATE];


    return [{
      type: type,
      name: field.name,
      mmTransform: reduceTransforms([_this._fieldInputTransform(field, INPUT_UPDATE), isNested ? _this._applyNestedTransform(type) : null])
    }]; // this._wrapTransformInputObjectFlat(
    //   {
    //     type,
    //     name: field.name,
    //   },
    //   INPUT_UPDATE,
    //   { isInterface, [TRANSFORM_INPUT]: field[TRANSFORM_INPUT] }
    // )
    // {
    //   ...field,
    //   type,
    //   name: field.name,
    //   mmTransform: async params => {
    //     if (transformFunc) {
    //       params = await transformFunc(params);
    //     }
    //     if (isInterface) {
    //       params = await asyncMapValues(params, async value =>
    //         this._validateAndTransformInterfaceInput(
    //           await applyInputTransform(value, newFieldType),
    //           newFieldType
    //         )
    //       );
    //     }
    //     return params;
    //   },
    // },
    // ];
  });
  (0, _defineProperty2.default)(this, "_defaultTransformToInputCreate", function (field) {
    var lastType = (0, _utils.getLastType)(field.type);
    var isMany = (0, _utils.hasQLListType)(field.type);
    var isRequired = field.type instanceof _graphql.GraphQLNonNull;
    var isNested = false;
    var isInterface = false;
    var newFieldType = lastType;
    var type;

    if (lastType instanceof _graphql.GraphQLInterfaceType) {
      isNested = true;
      isInterface = true;
    }

    if (lastType instanceof _graphql.GraphQLObjectType) {
      isNested = true;
    }

    if (isNested) {
      if (isRequired) {
        newFieldType = _this._inputType(lastType, isMany ? INPUT_CREATE_MANY_REQUIRED_NESTED : INPUT_CREATE_ONE_REQUIRED_NESTED);
        type = new _graphql.GraphQLNonNull(newFieldType);
      } else {
        newFieldType = _this._inputType(lastType, isMany ? INPUT_CREATE_MANY_NESTED : INPUT_CREATE_ONE_NESTED);
        type = newFieldType;
      }
    } else {
      type = (0, _utils.cloneSchema)(field.type, newFieldType);
    } // const { mmTransformInput = {} } = field;
    // let transformFunc = mmTransformInput[INPUT_CREATE];


    return [{
      type: type,
      name: field.name,
      mmTransform: function () {
        var _mmTransform = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee2(params) {
          return _regenerator.default.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  if (!transformFunc) {
                    _context2.next = 4;
                    break;
                  }

                  _context2.next = 3;
                  return transformFunc(params);

                case 3:
                  params = _context2.sent;

                case 4:
                  _context2.next = 6;
                  return (0, _utils.asyncMapValues)(params,
                  /*#__PURE__*/
                  function () {
                    var _ref2 = (0, _asyncToGenerator2.default)(
                    /*#__PURE__*/
                    _regenerator.default.mark(function _callee(value) {
                      return _regenerator.default.wrap(function _callee$(_context) {
                        while (1) {
                          switch (_context.prev = _context.next) {
                            case 0:
                              _context.next = 2;
                              return applyInputTransform(value, newFieldType);

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
                      return _ref2.apply(this, arguments);
                    };
                  }());

                case 6:
                  params = _context2.sent;

                  if (!isNested) {
                    _context2.next = 11;
                    break;
                  }

                  _context2.next = 10;
                  return (0, _utils.asyncMapValues)(params, function (value) {
                    value = _lodash.default.head(_lodash.default.values(value));

                    if (isInterface) {
                      value = _this._validateAndTransformInterfaceInput(value, type);
                    }

                    return value;
                  });

                case 10:
                  params = _context2.sent;

                case 11:
                  console.log({
                    params: params
                  });
                  return _context2.abrupt("return", params);

                case 13:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2, this);
        }));

        function mmTransform(_x) {
          return _mmTransform.apply(this, arguments);
        }

        return mmTransform;
      }()
    }];
  });
  (0, _defineProperty2.default)(this, "_defaultTransformToInputWhere", function (field) {
    var lastType = (0, _utils.getLastType)(field.type);
    var isMany = (0, _utils.hasQLListType)(field.type);
    var isNested = false;
    var isInterface = false;

    if (lastType instanceof _graphql.GraphQLInterfaceType) {
      isNested = true;
      isInterface = true;
    }

    if (lastType instanceof _graphql.GraphQLObjectType) {
      isNested = true;
    }

    var newFieldType = lastType;
    var fields = [];

    if (isNested) {
      ////Modifiers for interfaces
      var fieldName = field.name;
      fields.push(_this._wrapTransformInputObjectFlat({
        type: _this._inputType(lastType, isInterface ? INPUT_WHERE_INTERFACE : INPUT_WHERE),
        name: fieldName
      }, INPUT_WHERE, (0, _defineProperty2.default)({
        isInterface: isInterface
      }, TRANSFORM_INPUT, field[TRANSFORM_INPUT]))); // } else if (lastType instanceof GraphQLObjectType) {
      //   ////Modifiers for Nested objects
      //   let fieldName = field.name;
      //   fields.push(
      //     this._wrapTransformInputObjectFlat(
      //       {
      //         type: this._inputType(lastType, INPUT_WHERE),
      //         name: fieldName,
      //       },
      //       INPUT_WHERE,
      //       { [TRANSFORM_INPUT]: field[TRANSFORM_INPUT] }
      //     )
      //   );
    } else if (isMany) {
      ////Modifiers for arrays
      [{
        modifier: 'some',
        type: lastType
      }, {
        modifier: 'all',
        type: new _graphql.GraphQLList(lastType)
      }, {
        modifier: 'exact',
        type: new _graphql.GraphQLList(lastType)
      }, {
        modifier: 'in',
        type: new _graphql.GraphQLList(lastType)
      }, {
        modifier: 'nin',
        type: new _graphql.GraphQLList(lastType)
      }].forEach(function (item) {
        var modifier = item.modifier;
        var fieldName = field.name;

        if (modifier != '') {
          fieldName = "".concat(field.name, "_").concat(modifier);
        }

        fields.push(_this._wrapTransformInputWhere({
          type: item.type,
          name: fieldName
        }, (0, _defineProperty2.default)({
          modifier: modifier
        }, TRANSFORM_INPUT, field[TRANSFORM_INPUT])));
      });
    } else if (Modifiers[lastType]) {
      ////Modifiers for scalars
      var modifiers = Modifiers[lastType];
      modifiers.forEach(function (modifier) {
        var fieldName = field.name;

        if (modifier != '') {
          fieldName = "".concat(field.name, "_").concat(modifier);
        }

        fields.push(_this._wrapTransformInputWhere({
          type: newFieldType,
          name: fieldName
        }, (0, _defineProperty2.default)({
          modifier: modifier
        }, TRANSFORM_INPUT, field[TRANSFORM_INPUT])));
      });
    }

    return fields;
  });
  (0, _defineProperty2.default)(this, "_wrapTransformInputObjectFlat", function (field, target) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var transformFunc = options[TRANSFORM_INPUT] ? options[TRANSFORM_INPUT][target] : undefined;
    var _options$isInterface = options.isInterface,
        isInterface = _options$isInterface === void 0 ? false : _options$isInterface;

    field.mmTransform =
    /*#__PURE__*/
    function () {
      var _ref3 = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee4(params) {
        var fieldKey;
        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!transformFunc) {
                  _context4.next = 4;
                  break;
                }

                _context4.next = 3;
                return transformFunc(params);

              case 3:
                params = _context4.sent;

              case 4:
                fieldKey = _lodash.default.head(_lodash.default.keys(params));
                _context4.next = 7;
                return (0, _utils.asyncMapValues)(params,
                /*#__PURE__*/
                function () {
                  var _ref4 = (0, _asyncToGenerator2.default)(
                  /*#__PURE__*/
                  _regenerator.default.mark(function _callee3(value) {
                    return _regenerator.default.wrap(function _callee3$(_context3) {
                      while (1) {
                        switch (_context3.prev = _context3.next) {
                          case 0:
                            _context3.next = 2;
                            return applyInputTransform(value, field.type);

                          case 2:
                            value = _context3.sent;

                            if (isInterface) {
                              value = _this._validateAndTransformInterfaceInput(value, field.type);
                            }

                            value = _lodash.default.mapKeys(value, function (value, key) {
                              return "".concat(fieldKey, ".").concat(key);
                            });
                            return _context3.abrupt("return", value);

                          case 6:
                          case "end":
                            return _context3.stop();
                        }
                      }
                    }, _callee3, this);
                  }));

                  return function (_x4) {
                    return _ref4.apply(this, arguments);
                  };
                }());

              case 7:
                params = _context4.sent;
                return _context4.abrupt("return", params[fieldKey]);

              case 9:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      return function (_x3) {
        return _ref3.apply(this, arguments);
      };
    }();

    return field;
  });
  (0, _defineProperty2.default)(this, "_validateAndTransformInterfaceInput", function (value, type) {
    if (_lodash.default.keys(value).length > 1) {
      throw "You should not fill multiple fields in ".concat(type.name, " type");
    } else if (_lodash.default.keys(value).length == 0) {
      throw "You should fill any field in ".concat(type.name, " type");
    }

    return _lodash.default.head(_lodash.default.values(value));
  });
  (0, _defineProperty2.default)(this, "_wrapTransformInputWhere", function (field) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var transformFunc = options[TRANSFORM_INPUT] ? options[TRANSFORM_INPUT][INPUT_WHERE] : undefined;

    field.mmTransform =
    /*#__PURE__*/
    function () {
      var _ref5 = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee5(params) {
        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (!transformFunc) {
                  _context5.next = 4;
                  break;
                }

                _context5.next = 3;
                return transformFunc(params);

              case 3:
                params = _context5.sent;

              case 4:
                params = _this._transformInputWhere(params, options.modifier);
                return _context5.abrupt("return", params);

              case 6:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      return function (_x5) {
        return _ref5.apply(this, arguments);
      };
    }();

    return field;
  });
  (0, _defineProperty2.default)(this, "_transformInputWhere", function (params, modifier) {
    return (0, _lodash.default)(params).mapValues(function (value) {
      return _this._mapModifier(modifier, value);
    }).mapKeys(function (value, key) {
      if (modifier != '') {
        return key.substring(key.length - modifier.length - 1, 0);
      } else {
        return key;
      }
    }).value();
  });
  (0, _defineProperty2.default)(this, "_mapModifier", function (modifier, value) {
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
        return {
          $regex: ".*".concat(value, ".*")
        };

      case 'contains':
        return {
          $regex: ".*".concat(value, ".*")
        };
        break;

      case 'not_contains':
        return {
          $not: {
            $regex: ".*".concat(value, ".*")
          }
        };

      case 'starts_with':
        return {
          $regex: ".*".concat(value)
        };

      case 'not_starts_with':
        return {
          $not: {
            $regex: ".*".concat(value)
          }
        };

      case 'ends_with':
        return {
          $regex: "".concat(value, ".*")
        };

      case 'not_ends_with':
        return {
          $not: {
            $regex: "".concat(value, ".*")
          }
        };

      case 'exists':
        return {
          $exists: value
        };

      default:
        return {};
    }
  });
  (0, _defineProperty2.default)(this, "_applyNestedTransform", function (type) {
    return (
      /*#__PURE__*/
      function () {
        var _ref7 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee7(params) {
          return _regenerator.default.wrap(function _callee7$(_context7) {
            while (1) {
              switch (_context7.prev = _context7.next) {
                case 0:
                  _context7.next = 2;
                  return (0, _utils.asyncMapValues)(params,
                  /*#__PURE__*/
                  function () {
                    var _ref8 = (0, _asyncToGenerator2.default)(
                    /*#__PURE__*/
                    _regenerator.default.mark(function _callee6(value) {
                      return _regenerator.default.wrap(function _callee6$(_context6) {
                        while (1) {
                          switch (_context6.prev = _context6.next) {
                            case 0:
                              _context6.next = 2;
                              return applyInputTransform(value, type);

                            case 2:
                              return _context6.abrupt("return", _context6.sent);

                            case 3:
                            case "end":
                              return _context6.stop();
                          }
                        }
                      }, _callee6, this);
                    }));

                    return function (_x7) {
                      return _ref8.apply(this, arguments);
                    };
                  }());

                case 2:
                  return _context7.abrupt("return", _context7.sent);

                case 3:
                case "end":
                  return _context7.stop();
              }
            }
          }, _callee7, this);
        }));

        return function (_x6) {
          return _ref7.apply(this, arguments);
        };
      }()
    );
  });
  (0, _defineProperty2.default)(this, "_fieldInputTransform", function () {
    var field = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var target = arguments.length > 1 ? arguments[1] : undefined;
    var _field$mmTransformInp = field.mmTransformInput,
        mmTransformInput = _field$mmTransformInp === void 0 ? {} : _field$mmTransformInp; //const TRANSFORM_INPUT

    return mmTransformInput[target];
  });
  (0, _defineProperty2.default)(this, "_type", function (typeName) {
    if (!_this.SchemaTypes[typeName]) throw "Type ".concat(typeName, " not found");
    return _this.SchemaTypes[typeName];
  });
  (0, _defineProperty2.default)(this, "_inputTypeName", function (typeName, target) {
    return "".concat(typeName).concat(target.charAt(0).toUpperCase() + target.slice(1), "Input");
  });
  (0, _defineProperty2.default)(this, "_createInputEnum", function (name, initialType, target) {
    var deafultTransformFunc = _this._defaultTransformToInput[target];
    var values = [];

    _lodash.default.values(initialType._fields).forEach(function (field) {
      var _field$mmTransformToI = field.mmTransformToInput,
          mmTransformToInput = _field$mmTransformToI === void 0 ? {} : _field$mmTransformToI;
      var transformFunc = mmTransformToInput[target] || deafultTransformFunc;
      values = (0, _toConsumableArray2.default)(values).concat((0, _toConsumableArray2.default)(transformFunc(field)));
    });

    var newType = new _graphql.GraphQLEnumType({
      name: name,
      values: _this._fieldsArrayToObject(values)
    });
    return newType;
  });
  (0, _defineProperty2.default)(this, "_createInputObject", function (name, initialType, target) {
    var newType = new _graphql.GraphQLInputObjectType({
      name: name,
      fields: {}
    });
    newType.getFields();
    newType.mmFill = _this._fillInputObject(newType, initialType, target);
    return newType;
  });
  (0, _defineProperty2.default)(this, "_createInputObjectInterface", function (name, initialType, target) {
    var newType = new _graphql.GraphQLInputObjectType({
      name: name,
      fields: {}
    });
    newType.getFields();
    newType.mmFill = _this._fillInputObjectInterface(newType, initialType, target);
    return newType;
  });
  (0, _defineProperty2.default)(this, "_addAndOr", function (fields, type) {
    var manyType = new _graphql.GraphQLList(type);
    fields.AND = {
      name: 'AND',
      type: manyType,
      mmTransform: function () {
        var _mmTransform2 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee8(params) {
          return _regenerator.default.wrap(function _callee8$(_context8) {
            while (1) {
              switch (_context8.prev = _context8.next) {
                case 0:
                  _context8.next = 2;
                  return applyInputTransform(params.AND, manyType);

                case 2:
                  params = _context8.sent;
                  return _context8.abrupt("return", {
                    $and: params
                  });

                case 4:
                case "end":
                  return _context8.stop();
              }
            }
          }, _callee8, this);
        }));

        function mmTransform(_x8) {
          return _mmTransform2.apply(this, arguments);
        }

        return mmTransform;
      }()
    };
    fields.OR = {
      name: 'OR',
      type: manyType,
      mmTransform: function () {
        var _mmTransform3 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee9(params) {
          return _regenerator.default.wrap(function _callee9$(_context9) {
            while (1) {
              switch (_context9.prev = _context9.next) {
                case 0:
                  _context9.next = 2;
                  return applyInputTransform(params.OR, manyType);

                case 2:
                  params = _context9.sent;
                  return _context9.abrupt("return", {
                    $or: params
                  });

                case 4:
                case "end":
                  return _context9.stop();
              }
            }
          }, _callee9, this);
        }));

        function mmTransform(_x9) {
          return _mmTransform3.apply(this, arguments);
        }

        return mmTransform;
      }()
    };
  });
  (0, _defineProperty2.default)(this, "_fillInputObject", function (type, initialType, target) {
    return new Promise(function (resolve, reject) {
      process.nextTick(function () {
        var deafultTransformFunc = _this._defaultTransformToInput[target];
        var fields = {};

        if (target == INPUT_WHERE) {
          _this._addAndOr(fields, type);
        }

        _lodash.default.values(initialType._fields).forEach(function (field) {
          var _field$mmTransformToI2 = field.mmTransformToInput,
              mmTransformToInput = _field$mmTransformToI2 === void 0 ? {} : _field$mmTransformToI2;
          var transformFunc = mmTransformToInput[target] || deafultTransformFunc;
          fields = (0, _objectSpread2.default)({}, fields, _this._fieldsArrayToObject(transformFunc(field)));
        });

        type._fields = fields;
        resolve();
      });
    });
  });
  (0, _defineProperty2.default)(this, "_fillInputObjectInterface", function (type, initialType, target) {
    return new Promise(function (resolve, reject) {
      process.nextTick(function () {
        var _INPUT_WHERE_INTERFAC;

        target = (_INPUT_WHERE_INTERFAC = {}, (0, _defineProperty2.default)(_INPUT_WHERE_INTERFAC, INPUT_WHERE_INTERFACE, INPUT_WHERE), (0, _defineProperty2.default)(_INPUT_WHERE_INTERFAC, INPUT_WHERE_UNIQUE_INTERFACE, INPUT_WHERE_UNIQUE), (0, _defineProperty2.default)(_INPUT_WHERE_INTERFAC, INPUT_CREATE_INTERFACE, INPUT_CREATE), (0, _defineProperty2.default)(_INPUT_WHERE_INTERFAC, INPUT_UPDATE_INTERFACE, INPUT_UPDATE), _INPUT_WHERE_INTERFAC)[target];

        var fieldsArr = _lodash.default.values(_this.SchemaTypes).filter(function (itype) {
          return _lodash.default.isArray(itype._interfaces) && itype._interfaces.includes(initialType);
        });

        if ([INPUT_WHERE, INPUT_UPDATE, INPUT_WHERE_UNIQUE].includes(target)) {
          fieldsArr.push(initialType);
        }

        fieldsArr = fieldsArr.map(function (fieldType) {
          var mmTransform;

          var inputType = _this._inputType(fieldType, target);

          if ([INPUT_CREATE, INPUT_WHERE, INPUT_UPDATE, INPUT_WHERE_UNIQUE].includes(target) && fieldType != initialType && fieldType.mmDiscriminator && initialType.mmDiscriminatorField) {
            mmTransform =
            /*#__PURE__*/
            function () {
              var _ref9 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee10(params) {
                var value;
                return _regenerator.default.wrap(function _callee10$(_context10) {
                  while (1) {
                    switch (_context10.prev = _context10.next) {
                      case 0:
                        value = params[fieldType.name];
                        _context10.next = 3;
                        return applyInputTransform(value, inputType);

                      case 3:
                        value = _context10.sent;
                        value[initialType.mmDiscriminatorField] = fieldType.mmDiscriminator;
                        return _context10.abrupt("return", (0, _defineProperty2.default)({}, fieldType.name, value));

                      case 6:
                      case "end":
                        return _context10.stop();
                    }
                  }
                }, _callee10, this);
              }));

              return function mmTransform(_x10) {
                return _ref9.apply(this, arguments);
              };
            }();
          }

          return {
            name: fieldType.name,
            type: inputType,
            mmTransform: mmTransform
          };
        });
        type._fields = _this._fieldsArrayToObject(fieldsArr);
        resolve();
      });
    });
  });
  (0, _defineProperty2.default)(this, "_createInputNestedObject", function (name, initialType, target) {
    var isInterface = initialType instanceof _graphql.GraphQLInterfaceType;
    var isMany = [INPUT_CREATE_MANY_NESTED, INPUT_CREATE_MANY_REQUIRED_NESTED, INPUT_UPDATE_MANY_NESTED, INPUT_UPDATE_MANY_REQUIRED_NESTED].includes(target);
    var fields = {};

    if ([INPUT_CREATE_ONE_NESTED, INPUT_CREATE_ONE_REQUIRED_NESTED, INPUT_CREATE_MANY_NESTED, INPUT_CREATE_MANY_REQUIRED_NESTED, INPUT_UPDATE_ONE_NESTED, INPUT_UPDATE_ONE_REQUIRED_NESTED, INPUT_UPDATE_MANY_NESTED, INPUT_UPDATE_MANY_REQUIRED_NESTED].includes(target)) {
      var type = _this._inputType(initialType, isInterface ? INPUT_CREATE_INTERFACE : INPUT_CREATE);

      if (isMany) {
        type = new _graphql.GraphQLList(type);
      }

      fields.create = {
        name: 'create',
        type: type
      };
    }

    if ([INPUT_UPDATE_ONE_NESTED, INPUT_UPDATE_ONE_REQUIRED_NESTED].includes(target)) {
      var _type = _this._inputType(initialType, isInterface ? INPUT_UPDATE_INTERFACE : INPUT_UPDATE);

      fields.update = {
        name: 'update',
        type: _type
      };
    }

    if ([INPUT_UPDATE_MANY_NESTED, INPUT_UPDATE_MANY_REQUIRED_NESTED]) {
      var _type2 = _this._inputType(initialType, isInterface ? INPUT_UPDATE_INTERFACE : INPUT_UPDATE);

      _type2 = new _graphql.GraphQLList(_type2);
      fields.updateMany = {
        name: 'updateMany',
        type: _type2
      };
    }

    var newType = new _graphql.GraphQLInputObjectType({
      name: name,
      fields: fields
    });
    newType.getFields();
    return newType;
  });
  (0, _defineProperty2.default)(this, "_fieldsArrayToObject", function (arr) {
    var res = {};
    arr.forEach(function (field) {
      res[field.name] = field;
    });
    return res;
  });
  (0, _defineProperty2.default)(this, "_createInputType", function (name, initialType, kind) {
    var initFunc = _this.Kinds[kind];
    if (!initFunc) throw "Unknown kind ".concat(kind);
    var newType = initFunc(name, initialType, kind);
    _this.SchemaTypes[name] = newType;
    return newType;
  });
  (0, _defineProperty2.default)(this, "_inputType", function (type, target) {
    if ((0, _typeof2.default)(type) == String) {
      type = _this._type(type);
    }

    var typeName = _this._inputTypeName(type.name, target);

    try {
      return _this._type(typeName);
    } catch (err) {
      return _this._createInputType(typeName, type, target);
    }
  });
  (0, _defineProperty2.default)(this, "get", this._inputType);
  (0, _defineProperty2.default)(this, "wrapTransformInputWhere", this._wrapTransformInputWhere);
  (0, _defineProperty2.default)(this, "registerKind", function (kind, init) {
    if (_this.Kinds[kind]) throw "Kind ".concat(kind, " already registered");
    _this.Kinds[kind] = init;
  });
  this.SchemaTypes = SchemaTypes;
  this._defaultTransformToInput = (_this$_defaultTransfo = {}, (0, _defineProperty2.default)(_this$_defaultTransfo, INPUT_ORDER_BY, this._defaultTransformToInputOrderBy), (0, _defineProperty2.default)(_this$_defaultTransfo, INPUT_WHERE, this._defaultTransformToInputWhere), (0, _defineProperty2.default)(_this$_defaultTransfo, INPUT_WHERE_UNIQUE, function () {
    return [];
  }), (0, _defineProperty2.default)(_this$_defaultTransfo, INPUT_CREATE, this._defaultTransformToInputCreate), (0, _defineProperty2.default)(_this$_defaultTransfo, INPUT_UPDATE, this._defaultTransformToInputUpdate), _this$_defaultTransfo);
  this.registerKind(INPUT_CREATE, this._createInputObject);
  this.registerKind(INPUT_WHERE, this._createInputObject);
  this.registerKind(INPUT_WHERE_UNIQUE, this._createInputObject);
  this.registerKind(INPUT_UPDATE, this._createInputObject);
  this.registerKind(INPUT_ORDER_BY, this._createInputEnum);
  this.registerKind(INPUT_CREATE_INTERFACE, this._createInputObjectInterface);
  this.registerKind(INPUT_WHERE_INTERFACE, this._createInputObjectInterface);
  this.registerKind(INPUT_UPDATE_INTERFACE, this._createInputObjectInterface);
  this.registerKind(INPUT_WHERE_UNIQUE_INTERFACE, this._createInputObjectInterface);
  this.registerKind(INPUT_CREATE_ONE_NESTED, this._createInputNestedObject);
  this.registerKind(INPUT_CREATE_MANY_NESTED, this._createInputNestedObject);
  this.registerKind(INPUT_CREATE_ONE_REQUIRED_NESTED, this._createInputNestedObject);
  this.registerKind(INPUT_CREATE_MANY_REQUIRED_NESTED, this._createInputNestedObject);
  this.registerKind(INPUT_UPDATE_ONE_NESTED, this._createInputNestedObject);
  this.registerKind(INPUT_UPDATE_MANY_NESTED, this._createInputNestedObject); // this.registerKind(
  //   INPUT_UPDATE_INHERIT,
  //   this._createInputObjectUpdateInherit
  // );
};

exports.default = InputTypes;

var reduceTransforms = function reduceTransforms(arr) {
  return (
    /*#__PURE__*/
    function () {
      var _ref11 = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee12(params) {
        return _regenerator.default.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                _context12.next = 2;
                return (0, _utils.asyncForEach)(arr,
                /*#__PURE__*/
                function () {
                  var _ref12 = (0, _asyncToGenerator2.default)(
                  /*#__PURE__*/
                  _regenerator.default.mark(function _callee11(func) {
                    return _regenerator.default.wrap(function _callee11$(_context11) {
                      while (1) {
                        switch (_context11.prev = _context11.next) {
                          case 0:
                            if (!func) {
                              _context11.next = 4;
                              break;
                            }

                            _context11.next = 3;
                            return func(params);

                          case 3:
                            params = _context11.sent;

                          case 4:
                          case "end":
                            return _context11.stop();
                        }
                      }
                    }, _callee11, this);
                  }));

                  return function (_x12) {
                    return _ref12.apply(this, arguments);
                  };
                }());

              case 2:
                return _context12.abrupt("return", params);

              case 3:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      return function (_x11) {
        return _ref11.apply(this, arguments);
      };
    }()
  );
};

exports.reduceTransforms = reduceTransforms;

function appendTransform(field, type, functions) {
  if (!field[type]) field[type] = {};
  field[type] = (0, _objectSpread2.default)({}, field[type], functions);
}

function applyInputTransform(_x13, _x14) {
  return _applyInputTransform.apply(this, arguments);
}

function _applyInputTransform() {
  _applyInputTransform = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee14(value, type) {
    var fields, result;
    return _regenerator.default.wrap(function _callee14$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            if (!(type instanceof _graphql.GraphQLList)) {
              _context14.next = 6;
              break;
            }

            _context14.next = 3;
            return Promise.all(value.map(function (val) {
              return applyInputTransform(val, type.ofType);
            }));

          case 3:
            return _context14.abrupt("return", _context14.sent);

          case 6:
            if (!(type instanceof _graphql.GraphQLNonNull)) {
              _context14.next = 8;
              break;
            }

            return _context14.abrupt("return", applyInputTransform(value, type.ofType));

          case 8:
            fields = type._fields;

            if (fields) {
              _context14.next = 11;
              break;
            }

            return _context14.abrupt("return", value);

          case 11:
            result = {};
            _context14.next = 14;
            return (0, _utils.asyncForEach)(_lodash.default.keys(value),
            /*#__PURE__*/
            function () {
              var _ref13 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee13(key) {
                var field, val;
                return _regenerator.default.wrap(function _callee13$(_context13) {
                  while (1) {
                    switch (_context13.prev = _context13.next) {
                      case 0:
                        field = fields[key];
                        val = value[key];
                        _context13.t0 = _objectSpread2.default;
                        _context13.t1 = {};
                        _context13.t2 = result;

                        if (!field.mmTransform) {
                          _context13.next = 11;
                          break;
                        }

                        _context13.next = 8;
                        return field.mmTransform((0, _defineProperty2.default)({}, key, val));

                      case 8:
                        _context13.t3 = _context13.sent;
                        _context13.next = 18;
                        break;

                      case 11:
                        _context13.t4 = _defineProperty2.default;
                        _context13.t5 = {};
                        _context13.t6 = key;
                        _context13.next = 16;
                        return applyInputTransform(val, field.type);

                      case 16:
                        _context13.t7 = _context13.sent;
                        _context13.t3 = (0, _context13.t4)(_context13.t5, _context13.t6, _context13.t7);

                      case 18:
                        _context13.t8 = _context13.t3;
                        result = (0, _context13.t0)(_context13.t1, _context13.t2, _context13.t8);

                      case 20:
                      case "end":
                        return _context13.stop();
                    }
                  }
                }, _callee13, this);
              }));

              return function (_x15) {
                return _ref13.apply(this, arguments);
              };
            }());

          case 14:
            return _context14.abrupt("return", result);

          case 15:
          case "end":
            return _context14.stop();
        }
      }
    }, _callee14, this);
  }));
  return _applyInputTransform.apply(this, arguments);
}