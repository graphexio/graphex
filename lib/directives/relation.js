"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.RelationScheme = exports.INPUT_UPDATE_MANY_REQUIRED_RELATION = exports.INPUT_UPDATE_ONE_REQUIRED_RELATION = exports.INPUT_UPDATE_MANY_RELATION = exports.INPUT_UPDATE_ONE_RELATION = exports.INPUT_CREATE_MANY_RELATION = exports.INPUT_CREATE_ONE_RELATION = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf3 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _graphql = require("graphql");

var _graphqlTools = require("graphql-tools");

var _apolloServer = require("apollo-server");

var _lodash = _interopRequireDefault(require("lodash"));

var _utils = require("../utils");

var _queryExecutor = require("../queryExecutor");

var _inputTypes = _interopRequireDefault(require("../inputTypes"));

var _typeWrap = _interopRequireDefault(require("../typeWrap"));

var _utils2 = require("../inputTypes/utils");

var HANDLER = _interopRequireWildcard(require("../inputTypes/handlers"));

var KIND = _interopRequireWildcard(require("../inputTypes/kinds"));

var Transforms = _interopRequireWildcard(require("../inputTypes/transforms"));

var INPUT_CREATE_ONE_RELATION = 'createOneRelation';
exports.INPUT_CREATE_ONE_RELATION = INPUT_CREATE_ONE_RELATION;
var INPUT_CREATE_MANY_RELATION = 'createManyRelation';
exports.INPUT_CREATE_MANY_RELATION = INPUT_CREATE_MANY_RELATION;
var INPUT_UPDATE_ONE_RELATION = 'updateOneRelation';
exports.INPUT_UPDATE_ONE_RELATION = INPUT_UPDATE_ONE_RELATION;
var INPUT_UPDATE_MANY_RELATION = 'updateManyRelation';
exports.INPUT_UPDATE_MANY_RELATION = INPUT_UPDATE_MANY_RELATION;
var INPUT_UPDATE_ONE_REQUIRED_RELATION = 'updateOneRequiredRelation';
exports.INPUT_UPDATE_ONE_REQUIRED_RELATION = INPUT_UPDATE_ONE_REQUIRED_RELATION;
var INPUT_UPDATE_MANY_REQUIRED_RELATION = 'updateManyRequiredRelation';
exports.INPUT_UPDATE_MANY_REQUIRED_RELATION = INPUT_UPDATE_MANY_REQUIRED_RELATION;
var RelationScheme = "directive @relation(field:String=\"_id\", storeField:String=null ) on FIELD_DEFINITION";
exports.RelationScheme = RelationScheme;

var _default = function _default(queryExecutor) {
  var _temp;

  return _temp =
  /*#__PURE__*/
  function (_SchemaDirectiveVisit) {
    (0, _inherits2.default)(RelationDirective, _SchemaDirectiveVisit);

    function RelationDirective() {
      var _getPrototypeOf2;

      var _this;

      (0, _classCallCheck2.default)(this, RelationDirective);

      for (var _len = arguments.length, _args = new Array(_len), _key = 0; _key < _len; _key++) {
        _args[_key] = arguments[_key];
      }

      _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(RelationDirective)).call.apply(_getPrototypeOf2, [this].concat(_args)));
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_transformToInputWhere", function (_ref) {
        var field = _ref.field;
        var relationField = _this.args.field;

        var _assertThisInitialize = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)),
            fieldTypeWrap = _assertThisInitialize.mmFieldTypeWrap,
            collection = _assertThisInitialize.mmCollectionName,
            storeField = _assertThisInitialize.mmStoreField;

        var inputType = _inputTypes.default.get(fieldTypeWrap.realType(), KIND.WHERE);

        var modifiers = fieldTypeWrap.isMany() ? ['some', 'none'] : [''];
        var fields = [];
        modifiers.forEach(function (modifier) {
          var fieldName = field.name;

          if (modifier !== '') {
            fieldName = "".concat(field.name, "_").concat(modifier);
          }

          fields.push({
            name: fieldName,
            type: inputType,
            mmTransform: function () {
              var _mmTransform = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee(params, context) {
                var value;
                return _regenerator.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        params = params[fieldName];
                        _context.t0 = queryExecutor;
                        _context.t1 = _queryExecutor.DISTINCT;
                        _context.t2 = collection;
                        _context.t3 = context;
                        _context.next = 7;
                        return (0, _utils2.applyInputTransform)(context)(params, inputType);

                      case 7:
                        _context.t4 = _context.sent;
                        _context.t5 = {
                          key: relationField
                        };
                        _context.t6 = {
                          type: _context.t1,
                          collection: _context.t2,
                          context: _context.t3,
                          selector: _context.t4,
                          options: _context.t5
                        };
                        _context.next = 12;
                        return (0, _context.t0)(_context.t6);

                      case 12:
                        value = _context.sent;
                        // if (!isMany) {
                        value = {
                          $in: value
                        }; // }

                        return _context.abrupt("return", (0, _defineProperty2.default)({}, storeField, value));

                      case 15:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, this);
              }));

              function mmTransform(_x, _x2) {
                return _mmTransform.apply(this, arguments);
              }

              return mmTransform;
            }()
          });
        });
        return fields;
      });
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_transformToInputCreateUpdate", function (_ref3) {
        var field = _ref3.field,
            kind = _ref3.kind,
            inputTypes = _ref3.inputTypes;
        var fieldTypeWrap = new _typeWrap.default(field.type);
        var isCreate = kind === KIND.CREATE;
        var type = inputTypes.get(fieldTypeWrap.realType(), fieldTypeWrap.isMany() ? isCreate ? INPUT_CREATE_MANY_RELATION : fieldTypeWrap.isRequired() ? INPUT_UPDATE_MANY_REQUIRED_RELATION : INPUT_UPDATE_MANY_RELATION : isCreate ? INPUT_CREATE_ONE_RELATION : fieldTypeWrap.isRequired() ? INPUT_UPDATE_ONE_REQUIRED_RELATION : INPUT_UPDATE_ONE_RELATION);
        return [{
          name: field.name,
          type: type,
          mmTransform: (0, _utils2.reduceTransforms)([_this._validateInput(type, fieldTypeWrap.isMany()), Transforms.applyNestedTransform(type), fieldTypeWrap.isMany() ? _this._transformInputMany : _this._transformInputOne])
        }];
      });
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_validateInput", function (type, isMany) {
        return function (params) {
          var input = _lodash.default.head(_lodash.default.values(params));

          if (!isMany) {
            if (_lodash.default.keys(input) > 1) {
              throw new _apolloServer.UserInputError("You should not fill multiple fields in ".concat(type.name, " type"));
            } else if (_lodash.default.keys(input) === 0) {
              throw new _apolloServer.UserInputError("You should fill any field in ".concat(type.name, " type"));
            }
          } else {
            if ((input.disconnect || input.delete) && _lodash.default.difference(_lodash.default.keys(input), ['delete', 'disconnect']).length > 0) {
              throw new _apolloServer.UserInputError("Wrong input in ".concat(type.name, " type"));
            }
          }

          return params;
        };
      });
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_transformInputOne",
      /*#__PURE__*/
      function () {
        var _ref4 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee2(params, resolverArgs) {
          var parent, context, _assertThisInitialize2, storeField, input, selector, ids, doc, id;

          return _regenerator.default.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  parent = resolverArgs.parent, context = resolverArgs.context;
                  _assertThisInitialize2 = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), storeField = _assertThisInitialize2.mmStoreField;
                  input = _lodash.default.head(_lodash.default.values(params));

                  if (!input.connect) {
                    _context2.next = 13;
                    break;
                  }

                  ////Connect
                  selector = input.connect; // console.log(selector);

                  _context2.next = 7;
                  return _this._distinctQuery({
                    selector: selector,
                    context: context
                  });

                case 7:
                  ids = _context2.sent;

                  if (!(ids.length === 0)) {
                    _context2.next = 10;
                    break;
                  }

                  throw new _apolloServer.UserInputError("No records found for selector - ".concat(JSON.stringify(selector)));

                case 10:
                  return _context2.abrupt("return", (0, _defineProperty2.default)({}, storeField, _lodash.default.head(ids)));

                case 13:
                  if (!input.create) {
                    _context2.next = 21;
                    break;
                  }

                  ////Create
                  doc = input.create;
                  _context2.next = 17;
                  return _this._insertOneQuery({
                    doc: doc,
                    context: context
                  });

                case 17:
                  id = _context2.sent;
                  return _context2.abrupt("return", (0, _defineProperty2.default)({}, storeField, id));

                case 21:
                  if (!input.disconnect) {
                    _context2.next = 25;
                    break;
                  }

                  return _context2.abrupt("return", (0, _defineProperty2.default)({}, storeField, null));

                case 25:
                  if (input.delete) {////Delete
                  }

                case 26:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2, this);
        }));

        return function (_x3, _x4) {
          return _ref4.apply(this, arguments);
        };
      }());
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_transformInputMany",
      /*#__PURE__*/
      function () {
        var _ref8 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee3(params, resolverArgs) {
          var _assertThisInitialize3, storeField, parent, context, input, ids, selector, delete_ids, _selector, docs, create_ids;

          return _regenerator.default.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  _assertThisInitialize3 = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), storeField = _assertThisInitialize3.mmStoreField;
                  parent = resolverArgs.parent, context = resolverArgs.context;
                  input = _lodash.default.head(_lodash.default.values(params));
                  ids = [];

                  if (!(input.disconnect || input.delete)) {
                    _context3.next = 22;
                    break;
                  }

                  if (!input.disconnect) {
                    _context3.next = 12;
                    break;
                  }

                  ////Disconnect
                  selector = {
                    $or: input.disconnect
                  };
                  _context3.next = 9;
                  return _this._distinctQuery({
                    selector: selector,
                    context: context
                  });

                case 9:
                  ids = _context3.sent;

                  if (!(ids.length === 0)) {
                    _context3.next = 12;
                    break;
                  }

                  throw new _apolloServer.UserInputError("No records found for selector - ".concat(JSON.stringify(selector)));

                case 12:
                  if (!input.delete) {
                    _context3.next = 19;
                    break;
                  }

                  delete_ids = input.delete.map(function (selector) {
                    return _this._deleteOneQuery({
                      selector: selector,
                      context: context
                    });
                  });
                  _context3.next = 16;
                  return Promise.all(delete_ids);

                case 16:
                  delete_ids = _context3.sent;
                  delete_ids = delete_ids.filter(function (id) {
                    return id;
                  });
                  ids = [].concat((0, _toConsumableArray2.default)(ids), (0, _toConsumableArray2.default)(delete_ids));

                case 19:
                  return _context3.abrupt("return", (0, _defineProperty2.default)({}, storeField, {
                    $mmPullAll: ids
                  }));

                case 22:
                  if (!input.connect) {
                    _context3.next = 27;
                    break;
                  }

                  ////Connect
                  _selector = {
                    $or: input.connect
                  };
                  _context3.next = 26;
                  return _this._distinctQuery({
                    selector: _selector,
                    context: context
                  });

                case 26:
                  ids = _context3.sent;

                case 27:
                  if (!input.create) {
                    _context3.next = 33;
                    break;
                  }

                  ////Create
                  docs = input.create;
                  _context3.next = 31;
                  return _this._insertManyQuery({
                    docs: docs,
                    context: context
                  });

                case 31:
                  create_ids = _context3.sent;
                  ids = [].concat((0, _toConsumableArray2.default)(ids), (0, _toConsumableArray2.default)(create_ids));

                case 33:
                  return _context3.abrupt("return", (0, _defineProperty2.default)({}, storeField, {
                    $mmPushAll: ids
                  }));

                case 34:
                case "end":
                  return _context3.stop();
              }
            }
          }, _callee3, this);
        }));

        return function (_x5, _x6) {
          return _ref8.apply(this, arguments);
        };
      }());
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_onSchemaBuild", function (_ref11) {
        var field = _ref11.field;
        var fieldTypeWrap = new _typeWrap.default(field.type); //Collection name and interface modifier

        if (fieldTypeWrap.isInherited()) {
          var _fieldTypeWrap$realTy = fieldTypeWrap.realType(),
              mmDiscriminator = _fieldTypeWrap$realTy.mmDiscriminator;

          var _fieldTypeWrap$interf = fieldTypeWrap.interfaceType(),
              mmDiscriminatorField = _fieldTypeWrap$interf.mmDiscriminatorField;

          _this.mmCollectionName = fieldTypeWrap.realType().mmCollectionName;
          _this.mmInterfaceModifier = (0, _defineProperty2.default)({}, mmDiscriminatorField, mmDiscriminator);
        } else {
          _this.mmInterfaceModifier = {};
          _this.mmCollectionName = fieldTypeWrap.realType().mmCollectionName;
        }
      });
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_onSchemaInit", function (_ref12) {
        var field = _ref12.field;
        var fieldTypeWrap = new _typeWrap.default(field.type); ///Args and connection field

        if (fieldTypeWrap.isMany()) {
          var whereType = _inputTypes.default.get(fieldTypeWrap.realType(), fieldTypeWrap.isInterface() ? KIND.WHERE_INTERFACE : KIND.WHERE);

          var orderByType = _inputTypes.default.get(fieldTypeWrap.realType(), KIND.ORDER_BY);

          field.args = (0, _utils.allQueryArgs)({
            whereType: whereType,
            orderByType: orderByType
          });

          _this._addConnectionField(field);
        }
      });
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_resolveSingle", function (field) {
        return (
          /*#__PURE__*/
          function () {
            var _ref13 = (0, _asyncToGenerator2.default)(
            /*#__PURE__*/
            _regenerator.default.mark(function _callee4(parent, args, context, info) {
              var relationField, _assertThisInitialize4, collection, storeField, mmInterfaceModifier, value, selector;

              return _regenerator.default.wrap(function _callee4$(_context4) {
                while (1) {
                  switch (_context4.prev = _context4.next) {
                    case 0:
                      relationField = _this.args.field;
                      _assertThisInitialize4 = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), collection = _assertThisInitialize4.mmCollectionName, storeField = _assertThisInitialize4.mmStoreField, mmInterfaceModifier = _assertThisInitialize4.mmInterfaceModifier;
                      value = parent[storeField];

                      if (value) {
                        _context4.next = 5;
                        break;
                      }

                      return _context4.abrupt("return", null);

                    case 5:
                      selector = (0, _objectSpread2.default)({}, mmInterfaceModifier);
                      return _context4.abrupt("return", queryExecutor({
                        type: _queryExecutor.FIND_IDS,
                        collection: collection,
                        selector: selector,
                        options: {
                          selectorField: relationField,
                          ids: [value]
                        },
                        context: context
                      }).then(function (res) {
                        return _lodash.default.head(res);
                      }));

                    case 7:
                    case "end":
                      return _context4.stop();
                  }
                }
              }, _callee4, this);
            }));

            return function (_x7, _x8, _x9, _x10) {
              return _ref13.apply(this, arguments);
            };
          }()
        );
      });
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_resolveMany", function (field) {
        return (
          /*#__PURE__*/
          function () {
            var _ref14 = (0, _asyncToGenerator2.default)(
            /*#__PURE__*/
            _regenerator.default.mark(function _callee5(parent, args, context, info) {
              var relationField, _assertThisInitialize5, fieldTypeWrap, collection, storeField, mmInterfaceModifier, whereType, value, selector;

              return _regenerator.default.wrap(function _callee5$(_context5) {
                while (1) {
                  switch (_context5.prev = _context5.next) {
                    case 0:
                      relationField = _this.args.field;
                      _assertThisInitialize5 = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), fieldTypeWrap = _assertThisInitialize5.mmFieldTypeWrap, collection = _assertThisInitialize5.mmCollectionName, storeField = _assertThisInitialize5.mmStoreField, mmInterfaceModifier = _assertThisInitialize5.mmInterfaceModifier;
                      whereType = _inputTypes.default.get(fieldTypeWrap.realType(), fieldTypeWrap.isInterface() ? KIND.WHERE_INTERFACE : KIND.WHERE);
                      value = parent[storeField];

                      if (value) {
                        _context5.next = 6;
                        break;
                      }

                      return _context5.abrupt("return", fieldTypeWrap.isRequired() ? [] : null);

                    case 6:
                      _context5.next = 8;
                      return (0, _utils2.applyInputTransform)({
                        parent: parent,
                        context: context
                      })(args.where, whereType);

                    case 8:
                      selector = _context5.sent;

                      if (fieldTypeWrap.isInterface()) {
                        selector = Transforms.validateAndTransformInterfaceInput(whereType)({
                          selector: selector
                        }).selector;
                      }

                      selector = (0, _objectSpread2.default)({}, selector, mmInterfaceModifier);

                      if (args.skip) {
                        value = _lodash.default.drop(value, args.skip);
                      }

                      if (args.first) {
                        value = _lodash.default.take(value, args.first);
                      }

                      return _context5.abrupt("return", queryExecutor({
                        type: _queryExecutor.FIND_IDS,
                        collection: collection,
                        selector: selector,
                        options: {
                          selectorField: relationField,
                          ids: value
                        },
                        context: context
                      }));

                    case 14:
                    case "end":
                      return _context5.stop();
                  }
                }
              }, _callee5, this);
            }));

            return function (_x11, _x12, _x13, _x14) {
              return _ref14.apply(this, arguments);
            };
          }()
        );
      });
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_addConnectionField", function (field) {
        var _HANDLER$TRANSFORM_TO;

        var relationField = _this.args.field;

        var _assertThisInitialize6 = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)),
            fieldTypeWrap = _assertThisInitialize6.mmFieldTypeWrap,
            collection = _assertThisInitialize6.mmCollectionName,
            storeField = _assertThisInitialize6.mmStoreField;

        var SchemaTypes = _this.schema._typeMap;

        var whereType = _inputTypes.default.get(fieldTypeWrap.realType(), 'where');

        var orderByType = _inputTypes.default.get(fieldTypeWrap.realType(), 'orderBy');

        var connectionName = "".concat(field.name, "Connection");
        _this.mmObjectType._fields[connectionName] = (0, _defineProperty2.default)({
          name: connectionName,
          isDeprecated: false,
          args: (0, _utils.allQueryArgs)({
            whereType: whereType,
            orderByType: orderByType
          }),
          type: SchemaTypes["".concat(fieldTypeWrap.realType().name, "Connection")],
          resolve: function () {
            var _resolve = (0, _asyncToGenerator2.default)(
            /*#__PURE__*/
            _regenerator.default.mark(function _callee6(parent, args, context, info) {
              var value, selector;
              return _regenerator.default.wrap(function _callee6$(_context6) {
                while (1) {
                  switch (_context6.prev = _context6.next) {
                    case 0:
                      value = parent[storeField];

                      if (_lodash.default.isArray(value)) {
                        value = {
                          $in: value
                        };
                      }

                      _context6.next = 4;
                      return (0, _utils2.applyInputTransform)({
                        parent: parent,
                        context: context
                      })(args.where, whereType);

                    case 4:
                      _context6.t0 = _context6.sent;
                      _context6.t1 = (0, _defineProperty2.default)({}, relationField, value);
                      _context6.t2 = [_context6.t0, _context6.t1];
                      selector = {
                        $and: _context6.t2
                      };
                      return _context6.abrupt("return", {
                        _selector: selector,
                        _skip: args.skip,
                        _limit: args.first
                      });

                    case 9:
                    case "end":
                      return _context6.stop();
                  }
                }
              }, _callee6, this);
            }));

            function resolve(_x15, _x16, _x17, _x18) {
              return _resolve.apply(this, arguments);
            }

            return resolve;
          }()
        }, HANDLER.TRANSFORM_TO_INPUT, (_HANDLER$TRANSFORM_TO = {}, (0, _defineProperty2.default)(_HANDLER$TRANSFORM_TO, KIND.CREATE, function () {
          return [];
        }), (0, _defineProperty2.default)(_HANDLER$TRANSFORM_TO, KIND.WHERE, function () {
          return [];
        }), (0, _defineProperty2.default)(_HANDLER$TRANSFORM_TO, KIND.UPDATE, function () {
          return [];
        }), (0, _defineProperty2.default)(_HANDLER$TRANSFORM_TO, KIND.ORDER_BY, function () {
          return [];
        }), _HANDLER$TRANSFORM_TO));
      });
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_distinctQuery",
      /*#__PURE__*/
      function () {
        var _ref17 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee7(_ref16) {
          var selector, context, relationField, _assertThisInitialize7, collection, storeField, mmInterfaceModifier;

          return _regenerator.default.wrap(function _callee7$(_context7) {
            while (1) {
              switch (_context7.prev = _context7.next) {
                case 0:
                  selector = _ref16.selector, context = _ref16.context;
                  relationField = _this.args.field;
                  _assertThisInitialize7 = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), collection = _assertThisInitialize7.mmCollectionName, storeField = _assertThisInitialize7.mmStoreField, mmInterfaceModifier = _assertThisInitialize7.mmInterfaceModifier;
                  selector = (0, _objectSpread2.default)({}, selector, mmInterfaceModifier);
                  return _context7.abrupt("return", queryExecutor({
                    type: _queryExecutor.DISTINCT,
                    collection: collection,
                    selector: selector,
                    context: context,
                    options: {
                      key: relationField
                    }
                  }));

                case 5:
                case "end":
                  return _context7.stop();
              }
            }
          }, _callee7, this);
        }));

        return function (_x19) {
          return _ref17.apply(this, arguments);
        };
      }());
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_deleteOneQuery",
      /*#__PURE__*/
      function () {
        var _ref19 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee8(_ref18, context) {
          var selector, relationField, _assertThisInitialize8, collection, storeField, mmInterfaceModifier;

          return _regenerator.default.wrap(function _callee8$(_context8) {
            while (1) {
              switch (_context8.prev = _context8.next) {
                case 0:
                  selector = _ref18.selector;
                  relationField = _this.args.field;
                  _assertThisInitialize8 = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), collection = _assertThisInitialize8.mmCollectionName, storeField = _assertThisInitialize8.mmStoreField, mmInterfaceModifier = _assertThisInitialize8.mmInterfaceModifier;
                  selector = (0, _objectSpread2.default)({}, selector, mmInterfaceModifier);
                  return _context8.abrupt("return", queryExecutor({
                    type: _queryExecutor.DELETE_ONE,
                    collection: collection,
                    selector: selector,
                    context: context
                  }).then(function (res) {
                    return res ? res[relationField] : null;
                  }));

                case 5:
                case "end":
                  return _context8.stop();
              }
            }
          }, _callee8, this);
        }));

        return function (_x20, _x21) {
          return _ref19.apply(this, arguments);
        };
      }());
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_insertOneQuery",
      /*#__PURE__*/
      function () {
        var _ref21 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee9(_ref20, context) {
          var doc, relationField, _assertThisInitialize9, collection, storeField, mmInterfaceModifier;

          return _regenerator.default.wrap(function _callee9$(_context9) {
            while (1) {
              switch (_context9.prev = _context9.next) {
                case 0:
                  doc = _ref20.doc;
                  relationField = _this.args.field;
                  _assertThisInitialize9 = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), collection = _assertThisInitialize9.mmCollectionName, storeField = _assertThisInitialize9.mmStoreField, mmInterfaceModifier = _assertThisInitialize9.mmInterfaceModifier;
                  doc = (0, _objectSpread2.default)({}, doc, mmInterfaceModifier);
                  return _context9.abrupt("return", queryExecutor({
                    type: _queryExecutor.INSERT_ONE,
                    collection: collection,
                    doc: doc,
                    context: context
                  }).then(function (res) {
                    return res[relationField];
                  }));

                case 5:
                case "end":
                  return _context9.stop();
              }
            }
          }, _callee9, this);
        }));

        return function (_x22, _x23) {
          return _ref21.apply(this, arguments);
        };
      }());
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_insertManyQuery",
      /*#__PURE__*/
      function () {
        var _ref23 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee10(_ref22, context) {
          var docs, relationField, _assertThisInitialize10, collection, storeField, mmInterfaceModifier;

          return _regenerator.default.wrap(function _callee10$(_context10) {
            while (1) {
              switch (_context10.prev = _context10.next) {
                case 0:
                  docs = _ref22.docs;
                  relationField = _this.args.field;
                  _assertThisInitialize10 = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), collection = _assertThisInitialize10.mmCollectionName, storeField = _assertThisInitialize10.mmStoreField, mmInterfaceModifier = _assertThisInitialize10.mmInterfaceModifier;
                  docs = docs.map(function (doc) {
                    return (0, _objectSpread2.default)({}, doc, mmInterfaceModifier);
                  });
                  return _context10.abrupt("return", queryExecutor({
                    type: _queryExecutor.INSERT_MANY,
                    collection: collection,
                    docs: docs,
                    context: context
                  }).then(function (res) {
                    return res.map(function (item) {
                      return item[relationField];
                    });
                  }));

                case 5:
                case "end":
                  return _context10.stop();
              }
            }
          }, _callee10, this);
        }));

        return function (_x24, _x25) {
          return _ref23.apply(this, arguments);
        };
      }());
      return _this;
    }

    (0, _createClass2.default)(RelationDirective, [{
      key: "visitFieldDefinition",
      value: function visitFieldDefinition(field, _ref24) {
        var _appendTransform;

        var objectType = _ref24.objectType;
        var SchemaTypes = this.schema._typeMap;
        var _this$args = this.args,
            relationField = _this$args.field,
            storeField = _this$args.storeField;
        var fieldTypeWrap = new _typeWrap.default(field.type);

        if (!(0, _utils.getDirective)(fieldTypeWrap.realType(), 'model') && !(fieldTypeWrap.isInherited() && (0, _utils.getDirective)(fieldTypeWrap.interfaceType(), 'model'))) {
          throw "Relation field type should be defined with Model directive. (Field '".concat(field.name, "' of type '").concat(fieldTypeWrap.realType().name, "')");
        }

        this.mmObjectType = objectType;
        this.mmFieldTypeWrap = fieldTypeWrap;
        this.mmStoreField = storeField || (0, _utils.getRelationFieldName)(fieldTypeWrap.realType().name, relationField, fieldTypeWrap.isMany());
        (0, _utils2.appendTransform)(field, HANDLER.TRANSFORM_TO_INPUT, (_appendTransform = {}, (0, _defineProperty2.default)(_appendTransform, KIND.ORDER_BY, function (field) {
          return [];
        }), (0, _defineProperty2.default)(_appendTransform, KIND.CREATE, this._transformToInputCreateUpdate), (0, _defineProperty2.default)(_appendTransform, KIND.UPDATE, this._transformToInputCreateUpdate), (0, _defineProperty2.default)(_appendTransform, KIND.WHERE, this._transformToInputWhere), _appendTransform));
        field.mmOnSchemaInit = this._onSchemaInit;
        field.mmOnSchemaBuild = this._onSchemaBuild;
        field.resolve = fieldTypeWrap.isMany() ? this._resolveMany(field) : this._resolveSingle(field);
      }
    }]);
    return RelationDirective;
  }(_graphqlTools.SchemaDirectiveVisitor), _temp;
};

exports.default = _default;

var createInputTransform = function createInputTransform(type, isInterface) {
  return (0, _utils2.reduceTransforms)([Transforms.applyNestedTransform(type), isInterface ? Transforms.validateAndTransformInterfaceInput(type) : null]);
};

var createInput = function createInput(_ref25) {
  var name = _ref25.name,
      initialType = _ref25.initialType,
      kind = _ref25.kind,
      inputTypes = _ref25.inputTypes;
  var fields = {};
  var typeWrap = new _typeWrap.default(initialType);
  var createType = inputTypes.get(initialType, typeWrap.isInterface() ? KIND.CREATE_INTERFACE : KIND.CREATE);
  var whereType = inputTypes.get(initialType, typeWrap.isInterface() ? KIND.WHERE_INTERFACE : KIND.WHERE);
  var whereUniqueType = inputTypes.get(initialType, typeWrap.isInterface() ? KIND.WHERE_UNIQUE_INTERFACE : KIND.WHERE_UNIQUE);

  if ([INPUT_CREATE_MANY_RELATION, INPUT_UPDATE_MANY_RELATION, INPUT_UPDATE_MANY_REQUIRED_RELATION].includes(kind)) {
    createType = new _graphql.GraphQLList(createType);
    whereType = new _graphql.GraphQLList(whereType);
    whereUniqueType = new _graphql.GraphQLList(whereUniqueType);
  }

  fields.create = {
    name: 'create',
    type: createType,
    mmTransform: createInputTransform(createType, typeWrap.isInterface())
  };
  fields.connect = {
    name: 'connect',
    type: whereUniqueType,
    mmTransform: createInputTransform(whereUniqueType, typeWrap.isInterface())
  };

  if (kind === INPUT_UPDATE_ONE_RELATION) {
    fields.disconnect = {
      name: 'disconnect',
      type: _graphql.GraphQLBoolean
    }; // fields.delete = {
    //   name: 'delete',
    //   type: GraphQLBoolean,
    // };
  }

  if ([INPUT_UPDATE_MANY_RELATION, INPUT_UPDATE_MANY_REQUIRED_RELATION].includes(kind)) {
    fields.disconnect = {
      name: 'disconnect',
      type: whereType,
      mmTransform: createInputTransform(whereType, typeWrap.isInterface())
    };
    fields.delete = {
      name: 'delete',
      type: whereUniqueType,
      mmTransform: createInputTransform(whereUniqueType, typeWrap.isInterface())
    };
  }

  var newType = new _graphql.GraphQLInputObjectType({
    name: name,
    fields: fields
  });
  newType.getFields();
  return newType;
};

_inputTypes.default.registerKind(INPUT_CREATE_ONE_RELATION, createInput);

_inputTypes.default.registerKind(INPUT_CREATE_MANY_RELATION, createInput);

_inputTypes.default.registerKind(INPUT_UPDATE_ONE_RELATION, createInput);

_inputTypes.default.registerKind(INPUT_UPDATE_MANY_RELATION, createInput);

_inputTypes.default.registerKind(INPUT_UPDATE_ONE_REQUIRED_RELATION, createInput);

_inputTypes.default.registerKind(INPUT_UPDATE_MANY_REQUIRED_RELATION, createInput);