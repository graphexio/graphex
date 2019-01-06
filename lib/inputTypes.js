"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.appendTransform = appendTransform;
exports.applyInputTransform = applyInputTransform;
exports.default = exports.TRANSFORM_INPUT = exports.TRANSFORM_TO_INPUT = exports.INPUT_UPDATE = exports.INPUT_ORDER_BY = exports.INPUT_WHERE_UNIQUE = exports.INPUT_WHERE = exports.INPUT_CREATE = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _objectSpread3 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

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
var INPUT_ORDER_BY = 'orderBy';
exports.INPUT_ORDER_BY = INPUT_ORDER_BY;
var INPUT_UPDATE = 'update';
exports.INPUT_UPDATE = INPUT_UPDATE;
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
      isDeprecated: false,
      value: (0, _defineProperty2.default)({}, field.name, 1)
    }, {
      name: "".concat(field.name, "_DESC"),
      isDeprecated: false,
      value: (0, _defineProperty2.default)({}, field.name, -1)
    }];
  });
  (0, _defineProperty2.default)(this, "_defaultTransformToInputUpdate", function (field) {
    var lastType = (0, _utils.getLastType)(field.type);
    var newFieldType = lastType;

    if (lastType instanceof _graphql.GraphQLObjectType) {
      newFieldType = _this._inputType(field.type, INPUT_UPDATE);
    }

    var _field$mmTransformInp = field.mmTransformInput,
        mmTransformInput = _field$mmTransformInp === void 0 ? {} : _field$mmTransformInp;
    var transformFunc = mmTransformInput[INPUT_UPDATE];
    return [(0, _objectSpread3.default)({}, field, {
      type: (0, _utils.cloneSchemaOptional)(field.type, newFieldType),
      name: field.name,
      mmTransform: function () {
        var _mmTransform = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee(params) {
          return _regenerator.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  if (!transformFunc) {
                    _context.next = 4;
                    break;
                  }

                  _context.next = 3;
                  return transformFunc(params);

                case 3:
                  params = _context.sent;

                case 4:
                  return _context.abrupt("return", params);

                case 5:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));

        function mmTransform(_x) {
          return _mmTransform.apply(this, arguments);
        }

        return mmTransform;
      }()
    })];
  });
  (0, _defineProperty2.default)(this, "_defaultTransformToInputCreate", function (field) {
    var lastType = (0, _utils.getLastType)(field.type);
    var newFieldType = lastType;

    if (lastType instanceof _graphql.GraphQLObjectType) {
      newFieldType = _this._inputType(field.type, INPUT_CREATE);
    }

    var _field$mmTransformInp2 = field.mmTransformInput,
        mmTransformInput = _field$mmTransformInp2 === void 0 ? {} : _field$mmTransformInp2;
    var transformFunc = mmTransformInput[INPUT_CREATE];
    return [(0, _objectSpread3.default)({}, field, {
      type: (0, _utils.cloneSchema)(field.type, newFieldType),
      name: field.name,
      mmTransform: function () {
        var _mmTransform2 = (0, _asyncToGenerator2.default)(
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
                  return _context2.abrupt("return", params);

                case 5:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2, this);
        }));

        function mmTransform(_x2) {
          return _mmTransform2.apply(this, arguments);
        }

        return mmTransform;
      }()
    })];
  });
  (0, _defineProperty2.default)(this, "_defaultTransformToInputWhere", function (field) {
    var lastType = (0, _utils.getLastType)(field.type);
    var isMany = (0, _utils.hasQLListType)(field.type);
    var newFieldType = lastType;
    var fields = [];

    if (lastType instanceof _graphql.GraphQLObjectType) {
      ////Modifiers for embedded objects
      var fieldName = field.name;
      fields.push(_this._wrapTransformInputObjectWhere({
        type: _this._inputType(lastType, 'where'),
        name: fieldName
      }, (0, _defineProperty2.default)({
        modifier: ''
      }, TRANSFORM_INPUT, field[TRANSFORM_INPUT])));
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
  (0, _defineProperty2.default)(this, "_wrapTransformInputObjectWhere", function (field) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var transformFunc = options[TRANSFORM_INPUT] ? options[TRANSFORM_INPUT][INPUT_WHERE] : undefined;

    field.mmTransform =
    /*#__PURE__*/
    function () {
      var _ref2 = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee4(params) {
        var newParams, newValue, value;
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
                newParams = {};
                newValue = {};
                value = params[field.name];
                _context4.next = 9;
                return (0, _utils.asyncForEach)(_lodash.default.values(field.type._fields),
                /*#__PURE__*/
                function () {
                  var _ref3 = (0, _asyncToGenerator2.default)(
                  /*#__PURE__*/
                  _regenerator.default.mark(function _callee3(subfield) {
                    var val, _transformFunc;

                    return _regenerator.default.wrap(function _callee3$(_context3) {
                      while (1) {
                        switch (_context3.prev = _context3.next) {
                          case 0:
                            if (!value[subfield.name]) {
                              _context3.next = 8;
                              break;
                            }

                            val = _lodash.default.pick(value, subfield.name);
                            _transformFunc = subfield.mmTransform;

                            if (!_transformFunc) {
                              _context3.next = 7;
                              break;
                            }

                            _context3.next = 6;
                            return _transformFunc(val);

                          case 6:
                            val = _context3.sent;

                          case 7:
                            newValue = (0, _objectSpread3.default)({}, newValue, val);

                          case 8:
                          case "end":
                            return _context3.stop();
                        }
                      }
                    }, _callee3, this);
                  }));

                  return function (_x4) {
                    return _ref3.apply(this, arguments);
                  };
                }());

              case 9:
                _lodash.default.keys(newValue).forEach(function (key) {
                  newParams["".concat(field.name, ".").concat(key)] = newValue[key];
                });

                return _context4.abrupt("return", newParams);

              case 11:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      return function (_x3) {
        return _ref2.apply(this, arguments);
      };
    }();

    return field;
  });
  (0, _defineProperty2.default)(this, "_wrapTransformInputWhere", function (field) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var transformFunc = options[TRANSFORM_INPUT] ? options[TRANSFORM_INPUT][INPUT_WHERE] : undefined;

    field.mmTransform =
    /*#__PURE__*/
    function () {
      var _ref4 = (0, _asyncToGenerator2.default)(
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
        return _ref4.apply(this, arguments);
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
  (0, _defineProperty2.default)(this, "_type", function (typeName) {
    if (!_this.SchemaTypes[typeName]) throw "Type ".concat(typeName, " not found");
    return _this.SchemaTypes[typeName];
  });
  (0, _defineProperty2.default)(this, "_inputTypeName", function (typeName, target) {
    return "".concat(typeName).concat(target.charAt(0).toUpperCase() + target.slice(1), "Input");
  });
  (0, _defineProperty2.default)(this, "_createInputEnum", function (name, initialType, target) {
    var newType = new _graphql.GraphQLEnumType({
      name: name,
      values: {}
    });
    newType.mmFill = _this._fillInputEnum(newType, initialType, target);
    return newType;
  });
  (0, _defineProperty2.default)(this, "_fillInputEnum",
  /*#__PURE__*/
  function () {
    var _ref6 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee6(type, initialType, target) {
      var deafultTransformFunc, values;
      return _regenerator.default.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              deafultTransformFunc = _this._defaultTransformToInput[target];
              values = [];

              _lodash.default.values(initialType._fields).forEach(function (field) {
                var _field$mmTransformToI = field.mmTransformToInput,
                    mmTransformToInput = _field$mmTransformToI === void 0 ? {} : _field$mmTransformToI;
                var transformFunc = mmTransformToInput[target] || deafultTransformFunc;
                values = (0, _toConsumableArray2.default)(values).concat((0, _toConsumableArray2.default)(transformFunc(field)));
              });

              type._values = values;

            case 4:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6, this);
    }));

    return function (_x6, _x7, _x8) {
      return _ref6.apply(this, arguments);
    };
  }());
  (0, _defineProperty2.default)(this, "_createInputObject", function (name, initialType, target) {
    var newType = new _graphql.GraphQLInputObjectType({
      name: name,
      fields: {}
    });
    newType.getFields();
    newType.mmFill = _this._fillInputObject(newType, initialType, target);
    return newType;
  });
  (0, _defineProperty2.default)(this, "_addAndOr", function (fields, type) {
    var manyType = new _graphql.GraphQLList(type);
    fields.AND = {
      name: 'AND',
      type: manyType,
      mmTransform: function () {
        var _mmTransform3 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee7(params) {
          return _regenerator.default.wrap(function _callee7$(_context7) {
            while (1) {
              switch (_context7.prev = _context7.next) {
                case 0:
                  _context7.next = 2;
                  return applyInputTransform(params.AND, manyType);

                case 2:
                  params = _context7.sent;
                  return _context7.abrupt("return", {
                    $and: params
                  });

                case 4:
                case "end":
                  return _context7.stop();
              }
            }
          }, _callee7, this);
        }));

        function mmTransform(_x9) {
          return _mmTransform3.apply(this, arguments);
        }

        return mmTransform;
      }()
    };
    fields.OR = {
      name: 'OR',
      type: manyType,
      mmTransform: function () {
        var _mmTransform4 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee8(params) {
          return _regenerator.default.wrap(function _callee8$(_context8) {
            while (1) {
              switch (_context8.prev = _context8.next) {
                case 0:
                  _context8.next = 2;
                  return applyInputTransform(params.OR, manyType);

                case 2:
                  params = _context8.sent;
                  return _context8.abrupt("return", {
                    $or: params
                  });

                case 4:
                case "end":
                  return _context8.stop();
              }
            }
          }, _callee8, this);
        }));

        function mmTransform(_x10) {
          return _mmTransform4.apply(this, arguments);
        }

        return mmTransform;
      }()
    };
  });
  (0, _defineProperty2.default)(this, "_fillInputObject",
  /*#__PURE__*/
  function () {
    var _ref7 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee9(type, initialType, target) {
      var deafultTransformFunc, fields;
      return _regenerator.default.wrap(function _callee9$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              deafultTransformFunc = _this._defaultTransformToInput[target];
              fields = {};

              if (target == INPUT_WHERE) {
                _this._addAndOr(fields, type);
              }

              _lodash.default.values(initialType._fields).forEach(function (field) {
                var _field$mmTransformToI2 = field.mmTransformToInput,
                    mmTransformToInput = _field$mmTransformToI2 === void 0 ? {} : _field$mmTransformToI2;
                var transformFunc = mmTransformToInput[target] || deafultTransformFunc;
                fields = (0, _objectSpread3.default)({}, fields, _this._fieldsArrayToObject(transformFunc(field)));
              });

              type._fields = fields;

            case 5:
            case "end":
              return _context9.stop();
          }
        }
      }, _callee9, this);
    }));

    return function (_x11, _x12, _x13) {
      return _ref7.apply(this, arguments);
    };
  }());
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
  this.registerKind(INPUT_ORDER_BY, this._createInputEnum);
  this.registerKind(INPUT_UPDATE, this._createInputObject);
};

exports.default = InputTypes;

function appendTransform(field, type, functions) {
  if (!field[type]) field[type] = {};
  field[type] = (0, _objectSpread3.default)({}, field[type], functions);
}

function applyInputTransform(_x14, _x15) {
  return _applyInputTransform.apply(this, arguments);
}

function _applyInputTransform() {
  _applyInputTransform = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee11(params, type) {
    var lastType, fields, result;
    return _regenerator.default.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            if (!(0, _utils.hasQLListType)(type)) {
              _context11.next = 5;
              break;
            }

            lastType = (0, _utils.getLastType)(type);
            _context11.next = 4;
            return Promise.all(params.map(function (val) {
              return applyInputTransform(val, lastType);
            }));

          case 4:
            return _context11.abrupt("return", _context11.sent);

          case 5:
            fields = type._fields;
            result = {};
            _context11.next = 9;
            return (0, _utils.asyncForEach)(_lodash.default.keys(params),
            /*#__PURE__*/
            function () {
              var _ref8 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee10(key) {
                var field, value;
                return _regenerator.default.wrap(function _callee10$(_context10) {
                  while (1) {
                    switch (_context10.prev = _context10.next) {
                      case 0:
                        field = fields[key];
                        value = params[key];

                        if (!(field && field.mmTransform)) {
                          _context10.next = 12;
                          break;
                        }

                        _context10.t0 = _objectSpread3.default;
                        _context10.t1 = {};
                        _context10.t2 = result;
                        _context10.next = 8;
                        return field.mmTransform((0, _defineProperty2.default)({}, key, value));

                      case 8:
                        _context10.t3 = _context10.sent;
                        result = (0, _context10.t0)(_context10.t1, _context10.t2, _context10.t3);
                        _context10.next = 24;
                        break;

                      case 12:
                        if (!(0, _utils.getLastType)(field.type)._fields) {
                          _context10.next = 24;
                          break;
                        }

                        _context10.t4 = _objectSpread3.default;
                        _context10.t5 = {};
                        _context10.t6 = result;
                        _context10.t7 = _defineProperty2.default;
                        _context10.t8 = {};
                        _context10.t9 = key;
                        _context10.next = 21;
                        return applyInputTransform(value, field.type);

                      case 21:
                        _context10.t10 = _context10.sent;
                        _context10.t11 = (0, _context10.t7)(_context10.t8, _context10.t9, _context10.t10);
                        result = (0, _context10.t4)(_context10.t5, _context10.t6, _context10.t11);

                      case 24:
                      case "end":
                        return _context10.stop();
                    }
                  }
                }, _callee10, this);
              }));

              return function (_x16) {
                return _ref8.apply(this, arguments);
              };
            }());

          case 9:
            return _context11.abrupt("return", result);

          case 10:
          case "end":
            return _context11.stop();
        }
      }
    }, _callee11, this);
  }));
  return _applyInputTransform.apply(this, arguments);
}