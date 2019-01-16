"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _objectSpread4 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _lodash = _interopRequireDefault(require("lodash"));

var _graphql = require("graphql");

var _utils = require("../utils");

var _utils2 = require("./utils");

var _typeWrap = _interopRequireDefault(require("../typeWrap"));

var KIND = _interopRequireWildcard(require("./kinds"));

var HANDLER = _interopRequireWildcard(require("./handlers"));

var Transforms = _interopRequireWildcard(require("./transforms"));

var ObjectHash = require('object-hash');

var Modifiers = {
  Boolean: ['', 'not', 'exists'],
  ID: ['', 'in', 'not_in', 'exists'],
  ObjectID: ['', 'in', 'not_in', 'exists'],
  Int: ['', 'in', 'not_in', 'lt', 'lte', 'gt', 'gte', 'exists'],
  Float: ['', 'in', 'not_in', 'lt', 'lte', 'gt', 'gte', 'exists'],
  String: ['', 'not', 'in', 'not_in', 'lt', 'lte', 'gt', 'gte', 'contains', 'not_contains', 'starts_with', 'not_starts_with', 'ends_with', 'not_ends_with', 'exists']
};

var InputTypesClass = function InputTypesClass(SchemaTypes) {
  var _this = this,
      _this$_defaultTransfo;

  (0, _classCallCheck2.default)(this, InputTypesClass);
  (0, _defineProperty2.default)(this, "Kinds", []);
  (0, _defineProperty2.default)(this, "_defaultTransformToInputOrderBy", function (_ref) {
    var field = _ref.field;
    return [{
      name: "".concat(field.name, "_ASC"),
      value: (0, _defineProperty2.default)({}, field.name, 1)
    }, {
      name: "".concat(field.name, "_DESC"),
      value: (0, _defineProperty2.default)({}, field.name, -1)
    }];
  });
  (0, _defineProperty2.default)(this, "_defaultTransformToInputCreateUpdate", function (_ref2) {
    var field = _ref2.field,
        kind = _ref2.kind;
    var isCreate = kind == KIND.CREATE;
    var fieldTypeWrap = new _typeWrap.default(field.type);
    var typeWrap = fieldTypeWrap.clone();

    if (fieldTypeWrap.isNested()) {
      typeWrap.setRealType(_this._inputType(fieldTypeWrap.realType(), fieldTypeWrap.isMany() ? isCreate ? KIND.CREATE_MANY_NESTED : KIND.UPDATE_MANY_NESTED : isCreate ? KIND.CREATE_ONE_NESTED : KIND.UPDATE_ONE_NESTED));
      typeWrap.setMany(false);
    }

    if (!isCreate) {
      typeWrap.setRequired(false);
    }

    var type = typeWrap.type();
    return [{
      type: type,
      name: field.name,
      mmTransform: (0, _utils2.reduceTransforms)([// Transforms.log(1),
      Transforms.fieldInputTransform(field, kind), // Transforms.log(2),
      fieldTypeWrap.isNested() ? Transforms.applyNestedTransform(type) : null, // Transforms.log(3),
      fieldTypeWrap.isNested() ? Transforms.validateAndTransformNestedInput(type, fieldTypeWrap.isMany()) : null, // Transforms.log(4),
      fieldTypeWrap.isInterface() ? Transforms.validateAndTransformInterfaceInput(type) : null, // Transforms.log(5),
      !isCreate && fieldTypeWrap.isNested() ? function (params) {
        return !_lodash.default.isArray(_lodash.default.head(_lodash.default.values(params))) ? Transforms.flattenNested(params) : params;
      } : null])
    }];
  });
  (0, _defineProperty2.default)(this, "_defaultTransformToInputWhere", function (_ref3) {
    var field = _ref3.field;
    var fieldTypeWrap = new _typeWrap.default(field.type);
    var fields = [];

    if (fieldTypeWrap.isNested()) {
      var type = _this._inputType(fieldTypeWrap.realType(), fieldTypeWrap.isInterface() ? KIND.WHERE_INTERFACE : KIND.WHERE);

      fields.push({
        type: type,
        name: field.name,
        mmTransform: (0, _utils2.reduceTransforms)([Transforms.fieldInputTransform(field, KIND.WHERE), Transforms.applyNestedTransform(type), // Transforms.validateAndTransformNestedInput(type),
        fieldTypeWrap.isInterface() ? Transforms.validateAndTransformInterfaceInput(type) : null, Transforms.flattenNested])
      });
    } else if (fieldTypeWrap.isMany()) {
      [{
        modifier: 'some',
        type: fieldTypeWrap.realType()
      }, {
        modifier: 'all',
        type: new _graphql.GraphQLList(fieldTypeWrap.realType())
      }, {
        modifier: 'exact',
        type: new _graphql.GraphQLList(fieldTypeWrap.realType())
      }, {
        modifier: 'in',
        type: new _graphql.GraphQLList(fieldTypeWrap.realType())
      }, {
        modifier: 'nin',
        type: new _graphql.GraphQLList(fieldTypeWrap.realType())
      }].forEach(function (_ref4) {
        var modifier = _ref4.modifier,
            type = _ref4.type;
        fields.push({
          type: type,
          name: _this._fieldNameWithModifier(field.name, modifier),
          mmTransform: (0, _utils2.reduceTransforms)([Transforms.fieldInputTransform(field, KIND.WHERE), Transforms.transformModifier(modifier)])
        });
      });
    } else if (Modifiers[fieldTypeWrap.realType()]) {
      ////Modifiers for scalars
      Modifiers[fieldTypeWrap.realType()].forEach(function (modifier) {
        fields.push({
          type: fieldTypeWrap.realType(),
          name: _this._fieldNameWithModifier(field.name, modifier),
          mmTransform: (0, _utils2.reduceTransforms)([Transforms.fieldInputTransform(field, KIND.WHERE), Transforms.transformModifier(modifier)])
        });
      });
    }

    return fields;
  });
  (0, _defineProperty2.default)(this, "_fieldNameWithModifier", function (name, modifier) {
    if (modifier != '') {
      return "".concat(name, "_").concat(modifier);
    } else {
      return name;
    }
  });
  (0, _defineProperty2.default)(this, "_type", function (typeName) {
    if (!_this.SchemaTypes[typeName]) throw "Type ".concat(typeName, " not found");
    return _this.SchemaTypes[typeName];
  });
  (0, _defineProperty2.default)(this, "_inputTypeName", function (typeName, kind) {
    return "".concat(typeName).concat(kind.charAt(0).toUpperCase() + kind.slice(1), "Input");
  });
  (0, _defineProperty2.default)(this, "_createInputEnum", function (_ref5) {
    var name = _ref5.name,
        initialType = _ref5.initialType,
        kind = _ref5.kind;
    var deafultTransformFunc = _this._defaultTransformToInput[kind];
    var values = [];

    _lodash.default.values(initialType._fields).forEach(function (field) {
      var _field$mmTransformToI = field.mmTransformToInput,
          mmTransformToInput = _field$mmTransformToI === void 0 ? {} : _field$mmTransformToI;
      var transformFunc = mmTransformToInput[kind] || deafultTransformFunc;
      values = (0, _toConsumableArray2.default)(values).concat((0, _toConsumableArray2.default)(transformFunc({
        field: field,
        kind: kind,
        inputTypes: _this
      })));
    });

    var newType = new _graphql.GraphQLEnumType({
      name: name,
      values: _this._fieldsArrayToObject(values)
    });
    return newType;
  });
  (0, _defineProperty2.default)(this, "_createInputObject", function (_ref6) {
    var name = _ref6.name,
        initialType = _ref6.initialType,
        kind = _ref6.kind;
    var newType = new _graphql.GraphQLInputObjectType({
      name: name,
      fields: {}
    });
    newType.getFields();
    newType.mmFill = _this._fillInputObject(newType, initialType, kind);
    return newType;
  });
  (0, _defineProperty2.default)(this, "_createInputObjectInterface", function (_ref7) {
    var name = _ref7.name,
        initialType = _ref7.initialType,
        kind = _ref7.kind;
    var newType = new _graphql.GraphQLInputObjectType({
      name: name,
      fields: {}
    });
    newType.getFields();
    newType.mmFill = _this._fillInputObjectInterface(newType, initialType, kind);
    return newType;
  });
  (0, _defineProperty2.default)(this, "_createInputWithWhereNested", function (_ref8) {
    var name = _ref8.name,
        initialType = _ref8.initialType;
    var typeWrap = new _typeWrap.default(initialType);
    var newType = new _graphql.GraphQLInputObjectType({
      name: name,
      fields: {
        where: {
          name: 'where',
          type: _this._inputType(initialType, KIND.WHERE)
        },
        data: {
          name: 'data',
          type: _this._inputType(initialType, typeWrap.isInterface() ? KIND.UPDSTE_INTERFACE : KIND.UPDATE)
        }
      }
    });
    newType.getFields();
    return newType;
  });
  (0, _defineProperty2.default)(this, "_addAndOr", function (fields, type) {
    var manyType = new _graphql.GraphQLList(type);
    fields.AND = {
      name: 'AND',
      type: manyType,
      mmTransform: function () {
        var _mmTransform = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee(params) {
          return _regenerator.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.next = 2;
                  return (0, _utils2.applyInputTransform)(params.AND, manyType);

                case 2:
                  params = _context.sent;
                  return _context.abrupt("return", {
                    $and: params
                  });

                case 4:
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
    };
    fields.OR = {
      name: 'OR',
      type: manyType,
      mmTransform: function () {
        var _mmTransform2 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee2(params) {
          return _regenerator.default.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  _context2.next = 2;
                  return (0, _utils2.applyInputTransform)(params.OR, manyType);

                case 2:
                  params = _context2.sent;
                  return _context2.abrupt("return", {
                    $or: params
                  });

                case 4:
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
    };
  });
  (0, _defineProperty2.default)(this, "_fillInputObject", function (type, initialType, kind) {
    return new Promise(function (resolve, reject) {
      process.nextTick(function () {
        var deafultTransformFunc = _this._defaultTransformToInput[kind];
        var fields = {};

        if (kind == KIND.WHERE) {
          _this._addAndOr(fields, type);
        }

        _lodash.default.values(initialType._fields).forEach(function (field) {
          var _field$mmTransformToI2 = field.mmTransformToInput,
              mmTransformToInput = _field$mmTransformToI2 === void 0 ? {} : _field$mmTransformToI2;
          var transformFunc = mmTransformToInput[kind] || deafultTransformFunc;
          fields = (0, _objectSpread4.default)({}, fields, _this._fieldsArrayToObject(transformFunc({
            field: field,
            kind: kind,
            inputTypes: _this
          })));
        });

        type._fields = fields;
        resolve();
      });
    });
  });
  (0, _defineProperty2.default)(this, "_fillInputObjectInterface", function (type, initialType, kind) {
    return new Promise(function (resolve, reject) {
      process.nextTick(function () {
        var _KIND$WHERE_INTERFACE;

        kind = (_KIND$WHERE_INTERFACE = {}, (0, _defineProperty2.default)(_KIND$WHERE_INTERFACE, KIND.WHERE_INTERFACE, KIND.WHERE), (0, _defineProperty2.default)(_KIND$WHERE_INTERFACE, KIND.WHERE_UNIQUE_INTERFACE, KIND.WHERE_UNIQUE), (0, _defineProperty2.default)(_KIND$WHERE_INTERFACE, KIND.CREATE_INTERFACE, KIND.CREATE), (0, _defineProperty2.default)(_KIND$WHERE_INTERFACE, KIND.UPDATE_INTERFACE, KIND.UPDATE), _KIND$WHERE_INTERFACE)[kind];

        var fieldsArr = _lodash.default.values(_this.SchemaTypes).filter(function (itype) {
          return _lodash.default.isArray(itype._interfaces) && itype._interfaces.includes(initialType);
        });

        if ([KIND.WHERE, KIND.UPDATE, KIND.WHERE_UNIQUE].includes(kind)) {
          fieldsArr.push(initialType);
        }

        fieldsArr = fieldsArr.map(function (fieldType) {
          var mmTransform;

          var inputType = _this._inputType(fieldType, kind);

          if ([KIND.CREATE, KIND.WHERE, KIND.UPDATE, KIND.WHERE_UNIQUE].includes(kind) && fieldType != initialType && fieldType.mmDiscriminator && initialType.mmDiscriminatorField) {
            mmTransform = (0, _utils2.reduceTransforms)([Transforms.applyNestedTransform(inputType), kind == KIND.UPDATE ? function (params) {
              return _lodash.default.mapValues(params, function (val) {
                return (0, _objectSpread4.default)({}, val, (0, _defineProperty2.default)({}, initialType.mmDiscriminatorField, {
                  $mmEquals: fieldType.mmDiscriminator
                }));
              });
            } : function (params) {
              return _lodash.default.mapValues(params, function (val) {
                return (0, _objectSpread4.default)({}, val, (0, _defineProperty2.default)({}, initialType.mmDiscriminatorField, fieldType.mmDiscriminator));
              });
            }]); // async params => {
            //   let value = params[fieldType.name];
            //   value = await applyInputTransform(value, inputType);
            //   value[initialType.mmDiscriminatorField] =
            //     fieldType.mmDiscriminator;
            //   return { [fieldType.name]: value };
            // };
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
  (0, _defineProperty2.default)(this, "_createInputNestedObject", function (_ref9) {
    var name = _ref9.name,
        initialType = _ref9.initialType,
        kind = _ref9.kind;
    var isInterface = initialType instanceof _graphql.GraphQLInterfaceType;
    var isMany = [KIND.CREATE_MANY_NESTED, KIND.CREATE_MANY_REQUIRED_NESTED, KIND.UPDATE_MANY_NESTED, KIND.UPDATE_MANY_REQUIRED_NESTED].includes(kind);
    var fields = {};

    if ([KIND.CREATE_ONE_NESTED, KIND.CREATE_ONE_REQUIRED_NESTED, KIND.CREATE_MANY_NESTED, KIND.CREATE_MANY_REQUIRED_NESTED, KIND.UPDATE_ONE_NESTED, KIND.UPDATE_ONE_REQUIRED_NESTED, KIND.UPDATE_MANY_NESTED, KIND.UPDATE_MANY_REQUIRED_NESTED].includes(kind)) {
      var type = _this._inputType(initialType, isInterface ? KIND.CREATE_INTERFACE : KIND.CREATE);

      if (isMany) {
        type = new _graphql.GraphQLList(type);
      }

      fields.create = {
        name: 'create',
        type: type,
        mmTransform: (0, _utils2.reduceTransforms)([Transforms.applyNestedTransform(type), [KIND.UPDATE_MANY_NESTED, KIND.UPDATE_MANY_REQUIRED_NESTED].includes(kind) ? function (params) {
          return _lodash.default.mapValues(params, function (val) {
            return {
              $mmPushAll: val
            };
          });
        } : null])
      };
    }

    if ([KIND.UPDATE_ONE_NESTED, KIND.UPDATE_ONE_REQUIRED_NESTED].includes(kind)) {
      var _type = _this._inputType(initialType, isInterface ? KIND.UPDATE_INTERFACE : KIND.UPDATE);

      fields.update = {
        name: 'update',
        type: _type,
        mmTransform: (0, _utils2.reduceTransforms)([Transforms.applyNestedTransform(_type), !isInterface ? function (params) {
          return {
            update: (0, _objectSpread4.default)({}, params.update, {
              $mmExists: true
            })
          };
        } : null])
      };
    }

    if ([KIND.UPDATE_ONE_NESTED].includes(kind)) {
      fields.delete = {
        name: 'delete',
        type: _graphql.GraphQLBoolean,
        mmTransform: function mmTransform(params) {
          return _lodash.default.mapValues(params, function (val) {
            return {
              $mmUnset: true
            };
          });
        }
      };
    }

    if ([KIND.UPDATE_MANY_NESTED, KIND.UPDATE_MANY_REQUIRED_NESTED].includes(kind)) {
      var updateType = new _graphql.GraphQLList(_this._inputType(initialType, KIND.UPDATE_WITH_WHERE_NESTED));
      fields.updateMany = {
        name: 'updateMany',
        type: updateType,
        mmTransform: (0, _utils2.reduceTransforms)([Transforms.applyNestedTransform(updateType), function (params) {
          return _lodash.default.mapValues(params, function (arr) {
            var result = {};
            arr.forEach(function (_ref10) {
              var data = _ref10.data,
                  where = _ref10.where;
              var hash = ObjectHash(where);
              result["$[".concat(hash, "]")] = (0, _objectSpread4.default)({}, data, {
                $mmArrayFilter: Transforms.flattenNested((0, _defineProperty2.default)({}, hash, where))
              });
            });
            return Transforms.flattenNested(result);
          });
        }])
      };
      var whereType = new _graphql.GraphQLList(_this._inputType(initialType, isInterface ? KIND.WHERE_INTERFACE : KIND.WHERE));
      fields.deleteMany = {
        name: 'deleteMany',
        type: whereType,
        mmTransform: (0, _utils2.reduceTransforms)([Transforms.applyNestedTransform(whereType), function (params) {
          return _lodash.default.mapValues(params, function (val) {
            return {
              $mmPull: {
                $or: val
              }
            };
          });
        }])
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
    var newType = initFunc({
      name: name,
      initialType: initialType,
      kind: kind,
      inputTypes: _this
    });
    _this.SchemaTypes[name] = newType;
    return newType;
  });
  (0, _defineProperty2.default)(this, "_inputType", function (type, kind) {
    if ((0, _typeof2.default)(type) == String) {
      type = _this._type(type);
    }

    var typeName = _this._inputTypeName(type.name, kind);

    try {
      return _this._type(typeName);
    } catch (err) {
      return _this._createInputType(typeName, type, kind);
    }
  });
  (0, _defineProperty2.default)(this, "exist", this._type);
  (0, _defineProperty2.default)(this, "get", this._inputType);
  (0, _defineProperty2.default)(this, "registerKind", function (kind, init) {
    if (_this.Kinds[kind]) throw "Kind ".concat(kind, " already registered");
    _this.Kinds[kind] = init;
  });
  (0, _defineProperty2.default)(this, "setSchemaTypes", function (schemaTypes) {
    _this.SchemaTypes = schemaTypes;
  });
  this.SchemaTypes = SchemaTypes;
  this._defaultTransformToInput = (_this$_defaultTransfo = {}, (0, _defineProperty2.default)(_this$_defaultTransfo, KIND.ORDER_BY, this._defaultTransformToInputOrderBy), (0, _defineProperty2.default)(_this$_defaultTransfo, KIND.WHERE, this._defaultTransformToInputWhere), (0, _defineProperty2.default)(_this$_defaultTransfo, KIND.WHERE_UNIQUE, function () {
    return [];
  }), (0, _defineProperty2.default)(_this$_defaultTransfo, KIND.CREATE, this._defaultTransformToInputCreateUpdate), (0, _defineProperty2.default)(_this$_defaultTransfo, KIND.UPDATE, this._defaultTransformToInputCreateUpdate), _this$_defaultTransfo);
  this.registerKind(KIND.CREATE, this._createInputObject);
  this.registerKind(KIND.WHERE, this._createInputObject);
  this.registerKind(KIND.WHERE_UNIQUE, this._createInputObject);
  this.registerKind(KIND.UPDATE, this._createInputObject);
  this.registerKind(KIND.ORDER_BY, this._createInputEnum);
  this.registerKind(KIND.CREATE_INTERFACE, this._createInputObjectInterface);
  this.registerKind(KIND.WHERE_INTERFACE, this._createInputObjectInterface);
  this.registerKind(KIND.UPDATE_INTERFACE, this._createInputObjectInterface);
  this.registerKind(KIND.WHERE_UNIQUE_INTERFACE, this._createInputObjectInterface);
  this.registerKind(KIND.CREATE_ONE_NESTED, this._createInputNestedObject);
  this.registerKind(KIND.CREATE_MANY_NESTED, this._createInputNestedObject);
  this.registerKind(KIND.CREATE_ONE_REQUIRED_NESTED, this._createInputNestedObject);
  this.registerKind(KIND.CREATE_MANY_REQUIRED_NESTED, this._createInputNestedObject);
  this.registerKind(KIND.UPDATE_ONE_NESTED, this._createInputNestedObject);
  this.registerKind(KIND.UPDATE_MANY_NESTED, this._createInputNestedObject);
  this.registerKind(KIND.UPDATE_WITH_WHERE_NESTED, this._createInputWithWhereNested);
};

var InputTypes = new InputTypesClass();
var _default = InputTypes;
exports.default = _default;