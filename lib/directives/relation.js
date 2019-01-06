"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.RelationScheme = exports.INPUT_CREATE_CONNECT_MANY = exports.INPUT_CREATE_CONNECT_ONE = void 0;

var _objectSpread4 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

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

var _inputTypes = _interopRequireWildcard(require("../inputTypes"));

var INPUT_CREATE_CONNECT_ONE = 'createConnectOne';
exports.INPUT_CREATE_CONNECT_ONE = INPUT_CREATE_CONNECT_ONE;
var INPUT_CREATE_CONNECT_MANY = 'createConnectMany';
exports.INPUT_CREATE_CONNECT_MANY = INPUT_CREATE_CONNECT_MANY;
var RelationScheme = "directive @relation(field:String=\"_id\", fieldType:String=\"ObjectID\" ) on FIELD_DEFINITION";
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
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_createInputOne", function (name, initialType, target) {
        var newType = new _graphql.GraphQLInputObjectType({
          name: name,
          fields: {
            create: {
              name: 'create',
              type: _this.mmInputTypes.get(initialType, _inputTypes.INPUT_CREATE)
            },
            connect: {
              name: 'connect',
              type: _this.mmInputTypes.get(initialType, _inputTypes.INPUT_WHERE_UNIQUE)
            }
          }
        });
        newType.getFields();
        return newType;
      });
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_createInputMany", function (name, initialType, target) {
        var newType = new _graphql.GraphQLInputObjectType({
          name: name,
          fields: {
            create: {
              name: 'create',
              type: new _graphql.GraphQLList(_this.mmInputTypes.get(initialType, _inputTypes.INPUT_CREATE))
            },
            connect: {
              name: 'connect',
              type: new _graphql.GraphQLList(_this.mmInputTypes.get(initialType, _inputTypes.INPUT_WHERE_UNIQUE))
            }
          }
        });
        newType.getFields();
        return newType;
      });
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_transformToInputWhere", function (field) {
        var relationField = _this.args.field;

        var _assertThisInitialize = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)),
            lastType = _assertThisInitialize.mmLastType,
            isMany = _assertThisInitialize.mmIsMany,
            storeField = _assertThisInitialize.mmStoreField;

        var collection = lastType.name;

        var inputType = _this.mmInputTypes.get(lastType, 'where');

        var modifiers = isMany ? ['some', 'none'] : [''];
        var fields = [];
        modifiers.forEach(function (modifier) {
          var fieldName = field.name;

          if (modifier != '') {
            fieldName = "".concat(field.name, "_").concat(modifier);
          }

          fields.push({
            name: fieldName,
            type: inputType,
            mmTransform: function () {
              var _mmTransform = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee(params) {
                var value;
                return _regenerator.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        params = params[field.name];
                        _context.t0 = queryExecutor;
                        _context.t1 = _queryExecutor.DISTINCT;
                        _context.t2 = collection;
                        _context.next = 6;
                        return (0, _inputTypes.applyInputTransform)(params, inputType);

                      case 6:
                        _context.t3 = _context.sent;
                        _context.t4 = {
                          key: relationField
                        };
                        _context.t5 = {
                          type: _context.t1,
                          collection: _context.t2,
                          selector: _context.t3,
                          options: _context.t4
                        };
                        _context.next = 11;
                        return (0, _context.t0)(_context.t5);

                      case 11:
                        value = _context.sent;
                        // if (!isMany) {
                        value = {
                          $in: value
                        }; // }

                        return _context.abrupt("return", (0, _defineProperty2.default)({}, storeField, value));

                      case 14:
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
          });
        });
        return fields;
      });
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_transformToInputCreateMany", function (field) {
        var _assertThisInitialize2 = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)),
            storeField = _assertThisInitialize2.mmStoreField;

        var type = _this.mmInputTypes.get((0, _utils.getLastType)(field.type), INPUT_CREATE_CONNECT_MANY);

        return [{
          name: field.name,
          type: type,
          mmTransform: function () {
            var _mmTransform2 = (0, _asyncToGenerator2.default)(
            /*#__PURE__*/
            _regenerator.default.mark(function _callee2(params) {
              var input, ids, docs, create_ids, selector, connect_ids;
              return _regenerator.default.wrap(function _callee2$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      input = params[field.name];
                      ids = [];

                      if (!input.create) {
                        _context2.next = 10;
                        break;
                      }

                      _context2.next = 5;
                      return (0, _inputTypes.applyInputTransform)(input, type);

                    case 5:
                      docs = _context2.sent.create;
                      _context2.next = 8;
                      return _this._insertManyQuery({
                        docs: docs
                      });

                    case 8:
                      create_ids = _context2.sent;
                      ids = (0, _toConsumableArray2.default)(ids).concat((0, _toConsumableArray2.default)(create_ids));

                    case 10:
                      if (!input.connect) {
                        _context2.next = 19;
                        break;
                      }

                      _context2.next = 13;
                      return (0, _inputTypes.applyInputTransform)(input, type);

                    case 13:
                      selector = _context2.sent.connect;
                      selector = {
                        $or: selector
                      };
                      _context2.next = 17;
                      return _this._distinctQuery({
                        selector: selector
                      });

                    case 17:
                      connect_ids = _context2.sent;
                      ids = (0, _toConsumableArray2.default)(ids).concat((0, _toConsumableArray2.default)(connect_ids));

                    case 19:
                      return _context2.abrupt("return", (0, _defineProperty2.default)({}, storeField, ids));

                    case 20:
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
        }];
      });
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_transformToInputCreateOne", function (field) {
        var _assertThisInitialize3 = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)),
            storeField = _assertThisInitialize3.mmStoreField;

        var type = _this.mmInputTypes.get((0, _utils.getLastType)(field.type), INPUT_CREATE_CONNECT_ONE);

        return [{
          name: field.name,
          type: type,
          mmTransform: function () {
            var _mmTransform3 = (0, _asyncToGenerator2.default)(
            /*#__PURE__*/
            _regenerator.default.mark(function _callee3(params) {
              var input, selector, ids, doc, id;
              return _regenerator.default.wrap(function _callee3$(_context3) {
                while (1) {
                  switch (_context3.prev = _context3.next) {
                    case 0:
                      input = params[field.name]; ////Create and Connect

                      if (!(input.create && input.connect)) {
                        _context3.next = 5;
                        break;
                      }

                      throw new _apolloServer.UserInputError("You should return only one document for singular relation.");

                    case 5:
                      if (!input.connect) {
                        _context3.next = 17;
                        break;
                      }

                      _context3.next = 8;
                      return (0, _inputTypes.applyInputTransform)(input, type);

                    case 8:
                      selector = _context3.sent.connect;
                      _context3.next = 11;
                      return _this._distinctQuery({
                        selector: selector
                      });

                    case 11:
                      ids = _context3.sent;

                      if (!(ids.length == 0)) {
                        _context3.next = 14;
                        break;
                      }

                      throw new _apolloServer.UserInputError("No records found for selector - ".concat(JSON.stringify(selector)));

                    case 14:
                      return _context3.abrupt("return", (0, _defineProperty2.default)({}, storeField, _lodash.default.head(ids)));

                    case 17:
                      if (!input.create) {
                        _context3.next = 27;
                        break;
                      }

                      _context3.next = 20;
                      return (0, _inputTypes.applyInputTransform)(input, type);

                    case 20:
                      doc = _context3.sent.create;
                      _context3.next = 23;
                      return _this._insertOneQuery({
                        doc: doc
                      });

                    case 23:
                      id = _context3.sent;
                      return _context3.abrupt("return", (0, _defineProperty2.default)({}, storeField, id));

                    case 27:
                      return _context3.abrupt("return", {});

                    case 28:
                    case "end":
                      return _context3.stop();
                  }
                }
              }, _callee3, this);
            }));

            function mmTransform(_x3) {
              return _mmTransform3.apply(this, arguments);
            }

            return mmTransform;
          }()
        }];
      });
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_onSchemaInit", function (field) {
        var _assertThisInitialize4 = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)),
            lastType = _assertThisInitialize4.mmLastType,
            isMany = _assertThisInitialize4.mmIsMany;

        if (isMany) {
          var whereType = _this.mmInputTypes.get(lastType, 'where');

          var orderByType = _this.mmInputTypes.get(lastType, 'orderBy');

          field.args = (0, _utils.allQueryArgs)({
            whereType: whereType,
            orderByType: orderByType
          });

          _this._addMetaField(field);
        }
      });
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_resolveSingle", function (field) {
        return (
          /*#__PURE__*/
          function () {
            var _ref5 = (0, _asyncToGenerator2.default)(
            /*#__PURE__*/
            _regenerator.default.mark(function _callee4(parent, args, context, info) {
              var relationField, _assertThisInitialize5, lastType, isMany, storeField, value, selector;

              return _regenerator.default.wrap(function _callee4$(_context4) {
                while (1) {
                  switch (_context4.prev = _context4.next) {
                    case 0:
                      relationField = _this.args.field;
                      _assertThisInitialize5 = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), lastType = _assertThisInitialize5.mmLastType, isMany = _assertThisInitialize5.mmIsMany, storeField = _assertThisInitialize5.mmStoreField;
                      value = parent[storeField];
                      selector = (0, _defineProperty2.default)({}, relationField, value);
                      return _context4.abrupt("return", queryExecutor({
                        type: _queryExecutor.FIND_ONE,
                        collection: lastType.name,
                        selector: (0, _defineProperty2.default)({}, relationField, value),
                        options: {
                          skip: args.skip,
                          limit: args.first
                        },
                        context: context
                      }));

                    case 5:
                    case "end":
                      return _context4.stop();
                  }
                }
              }, _callee4, this);
            }));

            return function (_x4, _x5, _x6, _x7) {
              return _ref5.apply(this, arguments);
            };
          }()
        );
      });
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_resolveMany", function (field) {
        return (
          /*#__PURE__*/
          function () {
            var _ref6 = (0, _asyncToGenerator2.default)(
            /*#__PURE__*/
            _regenerator.default.mark(function _callee5(parent, args, context, info) {
              var relationField, _assertThisInitialize6, lastType, isMany, storeField, whereType, value, selector;

              return _regenerator.default.wrap(function _callee5$(_context5) {
                while (1) {
                  switch (_context5.prev = _context5.next) {
                    case 0:
                      relationField = _this.args.field;
                      _assertThisInitialize6 = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), lastType = _assertThisInitialize6.mmLastType, isMany = _assertThisInitialize6.mmIsMany, storeField = _assertThisInitialize6.mmStoreField;
                      whereType = _this.mmInputTypes.get(lastType, 'where');
                      value = parent[storeField];

                      if (_lodash.default.isArray(value)) {
                        value = {
                          $in: value
                        };
                      }

                      _context5.t0 = _objectSpread4.default;
                      _context5.t1 = {};
                      _context5.next = 9;
                      return (0, _inputTypes.applyInputTransform)(args.where, whereType);

                    case 9:
                      _context5.t2 = _context5.sent;
                      _context5.t3 = (0, _defineProperty2.default)({}, relationField, value);
                      selector = (0, _context5.t0)(_context5.t1, _context5.t2, _context5.t3);
                      return _context5.abrupt("return", queryExecutor({
                        type: _queryExecutor.FIND,
                        collection: lastType.name,
                        selector: selector,
                        options: {
                          skip: args.skip,
                          limit: args.first
                        },
                        context: context
                      }));

                    case 13:
                    case "end":
                      return _context5.stop();
                  }
                }
              }, _callee5, this);
            }));

            return function (_x8, _x9, _x10, _x11) {
              return _ref6.apply(this, arguments);
            };
          }()
        );
      });
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_addMetaField", function (field) {
        var _TRANSFORM_TO_INPUT;

        var relationField = _this.args.field;

        var _assertThisInitialize7 = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)),
            lastType = _assertThisInitialize7.mmLastType,
            isMany = _assertThisInitialize7.mmIsMany,
            storeField = _assertThisInitialize7.mmStoreField;

        var SchemaTypes = _this.schema._typeMap;

        var whereType = _this.mmInputTypes.get(lastType, 'where');

        var orderByType = _this.mmInputTypes.get(lastType, 'orderBy');

        var metaName = "_".concat(field.name, "Meta");
        _this.mmObjectType._fields[metaName] = (0, _defineProperty2.default)({
          name: metaName,
          skipFilter: true,
          skipCreate: true,
          isDeprecated: false,
          args: (0, _utils.allQueryArgs)({
            whereType: whereType,
            orderByType: orderByType
          }),
          type: SchemaTypes._QueryMeta,
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

                      _context6.t0 = _objectSpread4.default;
                      _context6.t1 = {};
                      _context6.next = 6;
                      return (0, _inputTypes.applyInputTransform)(args.where, whereType);

                    case 6:
                      _context6.t2 = _context6.sent;
                      _context6.t3 = (0, _defineProperty2.default)({}, relationField, value);
                      selector = (0, _context6.t0)(_context6.t1, _context6.t2, _context6.t3);
                      return _context6.abrupt("return", {
                        count: queryExecutor({
                          type: _queryExecutor.COUNT,
                          collection: lastType.name,
                          selector: selector,
                          options: {
                            skip: args.skip,
                            limit: args.first
                          },
                          context: context
                        })
                      });

                    case 10:
                    case "end":
                      return _context6.stop();
                  }
                }
              }, _callee6, this);
            }));

            function resolve(_x12, _x13, _x14, _x15) {
              return _resolve.apply(this, arguments);
            }

            return resolve;
          }()
        }, _inputTypes.TRANSFORM_TO_INPUT, (_TRANSFORM_TO_INPUT = {}, (0, _defineProperty2.default)(_TRANSFORM_TO_INPUT, _inputTypes.INPUT_CREATE, function () {
          return [];
        }), (0, _defineProperty2.default)(_TRANSFORM_TO_INPUT, _inputTypes.INPUT_WHERE, function () {
          return [];
        }), (0, _defineProperty2.default)(_TRANSFORM_TO_INPUT, _inputTypes.INPUT_ORDER_BY, function () {
          return [];
        }), _TRANSFORM_TO_INPUT));
      });
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_distinctQuery",
      /*#__PURE__*/
      function () {
        var _ref8 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee7(_ref7) {
          var selector, relationField, _assertThisInitialize8, lastType, collection;

          return _regenerator.default.wrap(function _callee7$(_context7) {
            while (1) {
              switch (_context7.prev = _context7.next) {
                case 0:
                  selector = _ref7.selector;
                  relationField = _this.args.field;
                  _assertThisInitialize8 = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), lastType = _assertThisInitialize8.mmLastType;
                  collection = lastType.name;
                  return _context7.abrupt("return", queryExecutor({
                    type: _queryExecutor.DISTINCT,
                    collection: collection,
                    selector: selector,
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

        return function (_x16) {
          return _ref8.apply(this, arguments);
        };
      }());
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_insertOneQuery",
      /*#__PURE__*/
      function () {
        var _ref10 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee8(_ref9) {
          var doc, relationField, _assertThisInitialize9, lastType, collection;

          return _regenerator.default.wrap(function _callee8$(_context8) {
            while (1) {
              switch (_context8.prev = _context8.next) {
                case 0:
                  doc = _ref9.doc;
                  relationField = _this.args.field;
                  _assertThisInitialize9 = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), lastType = _assertThisInitialize9.mmLastType;
                  collection = lastType.name;
                  return _context8.abrupt("return", queryExecutor({
                    type: _queryExecutor.INSERT_ONE,
                    collection: collection,
                    doc: doc
                  }).then(function (res) {
                    return res[relationField];
                  }));

                case 5:
                case "end":
                  return _context8.stop();
              }
            }
          }, _callee8, this);
        }));

        return function (_x17) {
          return _ref10.apply(this, arguments);
        };
      }());
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_insertManyQuery",
      /*#__PURE__*/
      function () {
        var _ref12 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee9(_ref11) {
          var docs, relationField, _assertThisInitialize10, lastType, collection;

          return _regenerator.default.wrap(function _callee9$(_context9) {
            while (1) {
              switch (_context9.prev = _context9.next) {
                case 0:
                  docs = _ref11.docs;
                  relationField = _this.args.field;
                  _assertThisInitialize10 = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), lastType = _assertThisInitialize10.mmLastType;
                  collection = lastType.name;
                  return _context9.abrupt("return", queryExecutor({
                    type: _queryExecutor.INSERT_MANY,
                    collection: collection,
                    docs: docs
                  }).then(function (res) {
                    return res.map(function (item) {
                      return item[relationField];
                    });
                  }));

                case 5:
                case "end":
                  return _context9.stop();
              }
            }
          }, _callee9, this);
        }));

        return function (_x18) {
          return _ref12.apply(this, arguments);
        };
      }());
      return _this;
    }

    (0, _createClass2.default)(RelationDirective, [{
      key: "visitFieldDefinition",
      value: function visitFieldDefinition(field, _ref13) {
        var _appendTransform;

        var objectType = _ref13.objectType;
        var SchemaTypes = this.schema._typeMap;
        var relationField = this.args.field;
        this.mmObjectType = objectType;
        this.mmInputTypes = new _inputTypes.default({
          SchemaTypes: SchemaTypes
        });
        this.mmInputTypes.registerKind(INPUT_CREATE_CONNECT_ONE, this._createInputOne);
        this.mmInputTypes.registerKind(INPUT_CREATE_CONNECT_MANY, this._createInputMany);
        this.mmLastType = (0, _utils.getLastType)(field.type);
        this.mmIsMany = (0, _utils.hasQLListType)(field.type);
        this.mmStoreField = (0, _utils.getRelationFieldName)(this.mmLastType.name, relationField, this.mmIsMany);
        (0, _inputTypes.appendTransform)(field, _inputTypes.TRANSFORM_TO_INPUT, (_appendTransform = {}, (0, _defineProperty2.default)(_appendTransform, _inputTypes.INPUT_ORDER_BY, function (field) {
          return [];
        }), (0, _defineProperty2.default)(_appendTransform, _inputTypes.INPUT_CREATE, this.mmIsMany ? this._transformToInputCreateMany : this._transformToInputCreateOne), (0, _defineProperty2.default)(_appendTransform, _inputTypes.INPUT_UPDATE, this.mmIsMany ? this._transformToInputCreateMany : this._transformToInputCreateOne), (0, _defineProperty2.default)(_appendTransform, _inputTypes.INPUT_WHERE, this._transformToInputWhere), _appendTransform));
        field.mmOnSchemaInit = this._onSchemaInit;
        field.resolve = this.mmIsMany ? this._resolveMany(field) : this._resolveSingle(field);
      }
    }]);
    return RelationDirective;
  }(_graphqlTools.SchemaDirectiveVisitor), _temp;
};

exports.default = _default;