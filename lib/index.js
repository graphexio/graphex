"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "QueryExecutor", {
  enumerable: true,
  get: function get() {
    return _queryExecutor.default;
  }
});
Object.defineProperty(exports, "getLastType", {
  enumerable: true,
  get: function get() {
    return _utils.getLastType;
  }
});
Object.defineProperty(exports, "getDirective", {
  enumerable: true,
  get: function get() {
    return _utils.getDirective;
  }
});
Object.defineProperty(exports, "getDirectiveArg", {
  enumerable: true,
  get: function get() {
    return _utils.getDirectiveArg;
  }
});
Object.defineProperty(exports, "getRelationFieldName", {
  enumerable: true,
  get: function get() {
    return _utils.getRelationFieldName;
  }
});
Object.defineProperty(exports, "hasQLListType", {
  enumerable: true,
  get: function get() {
    return _utils.hasQLListType;
  }
});
Object.defineProperty(exports, "mapFiltersToSelector", {
  enumerable: true,
  get: function get() {
    return _utils.mapFiltersToSelector;
  }
});
Object.defineProperty(exports, "allQueryArgs", {
  enumerable: true,
  get: function get() {
    return _utils.allQueryArgs;
  }
});
Object.defineProperty(exports, "hasQLNonNullType", {
  enumerable: true,
  get: function get() {
    return _utils.hasQLNonNullType;
  }
});
Object.defineProperty(exports, "cloneSchema", {
  enumerable: true,
  get: function get() {
    return _utils.cloneSchema;
  }
});
Object.defineProperty(exports, "combineResolvers", {
  enumerable: true,
  get: function get() {
    return _utils.combineResolvers;
  }
});
exports.default = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _graphqlTools = require("graphql-tools");

var _graphqlTag = _interopRequireDefault(require("graphql-tag"));

var _graphql = require("graphql");

var _lodash = _interopRequireDefault(require("lodash"));

var _pluralize = _interopRequireDefault(require("pluralize"));

var _queryExecutor = _interopRequireWildcard(require("./queryExecutor"));

var _utils = require("./utils");

var _initialScheme = _interopRequireDefault(require("./initialScheme"));

var _relation = _interopRequireWildcard(require("./directives/relation"));

var _extRelation = _interopRequireWildcard(require("./directives/extRelation"));

var _db = _interopRequireWildcard(require("./directives/db"));

var _model = _interopRequireWildcard(require("./directives/model"));

var _readOnly = _interopRequireWildcard(require("./directives/readOnly"));

var _unique = _interopRequireWildcard(require("./directives/unique"));

var _id = _interopRequireWildcard(require("./directives/id"));

var _scalars = _interopRequireWildcard(require("./scalars"));

var GeoJSONModule = _interopRequireWildcard(require("./geoJSON"));

var _inputTypes = _interopRequireWildcard(require("./inputTypes"));

var relationFieldDefault = '_id';

var ModelMongo = function ModelMongo(_ref) {
  var _this = this;

  var queryExecutor = _ref.queryExecutor;
  (0, _classCallCheck2.default)(this, ModelMongo);
  (0, _defineProperty2.default)(this, "_inputType", function (type, target) {
    return _this.InputTypes.get(type, target);
  });
  (0, _defineProperty2.default)(this, "_createAllQuery", function (modelType) {
    var whereType = _this._inputType(modelType, _inputTypes.INPUT_WHERE);

    var orderByType = _this._inputType(modelType, _inputTypes.INPUT_ORDER_BY);

    var name = (0, _pluralize.default)(modelType.name).toLowerCase();
    _this.Query._fields[name] = {
      type: new _graphql.GraphQLNonNull(new _graphql.GraphQLList(new _graphql.GraphQLNonNull(modelType))),
      description: undefined,
      args: (0, _utils.allQueryArgs)({
        whereType: whereType,
        orderByType: orderByType
      }),
      deprecationReason: undefined,
      isDeprecated: false,
      name: name,
      resolve: function () {
        var _resolve = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee(parent, args, context, info) {
          return _regenerator.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.t0 = _this;
                  _context.t1 = _queryExecutor.FIND;
                  _context.t2 = modelType.name;
                  _context.next = 5;
                  return (0, _inputTypes.applyInputTransform)(args.where, whereType);

                case 5:
                  _context.t3 = _context.sent;
                  _context.t4 = {
                    skip: args.skip,
                    limit: args.first,
                    sort: args.orderBy
                  };
                  _context.t5 = context;
                  _context.t6 = {
                    type: _context.t1,
                    collection: _context.t2,
                    selector: _context.t3,
                    options: _context.t4,
                    context: _context.t5
                  };
                  return _context.abrupt("return", _context.t0.QueryExecutor.call(_context.t0, _context.t6));

                case 10:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));

        function resolve(_x, _x2, _x3, _x4) {
          return _resolve.apply(this, arguments);
        }

        return resolve;
      }()
    };
  });
  (0, _defineProperty2.default)(this, "_createMetaQuery", function (modelType) {
    var whereType = _this._inputType(modelType, _inputTypes.INPUT_WHERE);

    var orderByType = _this._inputType(modelType, _inputTypes.INPUT_ORDER_BY);

    var name = "_".concat((0, _pluralize.default)(modelType.name).toLowerCase(), "Meta");
    _this.Query._fields[name] = {
      type: _this.SchemaTypes._QueryMeta,
      description: undefined,
      args: (0, _utils.allQueryArgs)({
        whereType: whereType,
        orderByType: orderByType
      }),
      deprecationReason: undefined,
      isDeprecated: false,
      name: name,
      resolve: function () {
        var _resolve2 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee2(parent, args, context, info) {
          return _regenerator.default.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  return _context2.abrupt("return", {
                    count: _this.QueryExecutor({
                      type: _queryExecutor.COUNT,
                      collection: modelType.name,
                      selector: (0, _inputTypes.applyInputTransform)(args.where, whereType),
                      options: {
                        skip: args.skip,
                        limit: args.first
                      },
                      context: context
                    })
                  });

                case 1:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2, this);
        }));

        function resolve(_x5, _x6, _x7, _x8) {
          return _resolve2.apply(this, arguments);
        }

        return resolve;
      }()
    };
  });
  (0, _defineProperty2.default)(this, "_createSingleQuery", function (modelType, Query) {
    var orderByType = _this._inputType(modelType, _inputTypes.INPUT_ORDER_BY);

    var whereUniqueType = _this._inputType(modelType, _inputTypes.INPUT_WHERE_UNIQUE);

    var args = [{
      name: 'where',
      type: whereUniqueType
    }];
    var name = modelType.name.toLowerCase();
    _this.Query._fields[name] = {
      type: modelType,
      description: undefined,
      args: args,
      deprecationReason: undefined,
      isDeprecated: false,
      name: name,
      resolve: function () {
        var _resolve3 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee3(parent, args, context, info) {
          return _regenerator.default.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  _context3.t0 = _this;
                  _context3.t1 = _queryExecutor.FIND_ONE;
                  _context3.t2 = modelType.name;
                  _context3.next = 5;
                  return (0, _inputTypes.applyInputTransform)(args.where, whereUniqueType);

                case 5:
                  _context3.t3 = _context3.sent;
                  _context3.t4 = {};
                  _context3.t5 = context;
                  _context3.t6 = {
                    type: _context3.t1,
                    collection: _context3.t2,
                    selector: _context3.t3,
                    options: _context3.t4,
                    context: _context3.t5
                  };
                  return _context3.abrupt("return", _context3.t0.QueryExecutor.call(_context3.t0, _context3.t6));

                case 10:
                case "end":
                  return _context3.stop();
              }
            }
          }, _callee3, this);
        }));

        function resolve(_x9, _x10, _x11, _x12) {
          return _resolve3.apply(this, arguments);
        }

        return resolve;
      }()
    };
  });
  (0, _defineProperty2.default)(this, "_createCreateMutation", function (modelType) {
    var whereType = _this._inputType(modelType, _inputTypes.INPUT_WHERE);

    var orderByType = _this._inputType(modelType, _inputTypes.INPUT_ORDER_BY);

    var inputType = _this._inputType(modelType, _inputTypes.INPUT_CREATE);

    var args = [{
      type: new _graphql.GraphQLNonNull(inputType),
      name: 'data'
    }];
    var name = "create".concat(modelType.name);
    _this.Mutation._fields[name] = {
      type: modelType,
      args: args,
      isDeprecated: false,
      name: name,
      resolve: function () {
        var _resolve4 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee4(parent, args, context, info) {
          return _regenerator.default.wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  _context4.t0 = _this;
                  _context4.t1 = _queryExecutor.INSERT_ONE;
                  _context4.t2 = modelType.name;
                  _context4.next = 5;
                  return (0, _inputTypes.applyInputTransform)(args.data, inputType);

                case 5:
                  _context4.t3 = _context4.sent;
                  _context4.t4 = {};
                  _context4.t5 = context;
                  _context4.t6 = {
                    type: _context4.t1,
                    collection: _context4.t2,
                    doc: _context4.t3,
                    options: _context4.t4,
                    context: _context4.t5
                  };
                  return _context4.abrupt("return", _context4.t0.QueryExecutor.call(_context4.t0, _context4.t6));

                case 10:
                case "end":
                  return _context4.stop();
              }
            }
          }, _callee4, this);
        }));

        function resolve(_x13, _x14, _x15, _x16) {
          return _resolve4.apply(this, arguments);
        }

        return resolve;
      }()
    };
  });
  (0, _defineProperty2.default)(this, "_createDeleteMutation", function (modelType) {
    var inputType = _this._inputType(modelType, _inputTypes.INPUT_WHERE_UNIQUE);

    var args = [{
      type: new _graphql.GraphQLNonNull(inputType),
      name: 'where'
    }];
    var name = "delete".concat(modelType.name);
    _this.Mutation._fields[name] = {
      type: modelType,
      args: args,
      isDeprecated: false,
      name: name,
      resolve: function () {
        var _resolve5 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee5(parent, args, context, info) {
          return _regenerator.default.wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  _context5.t0 = _this;
                  _context5.t1 = _queryExecutor.DELETE_ONE;
                  _context5.t2 = modelType.name;
                  _context5.next = 5;
                  return (0, _inputTypes.applyInputTransform)(args.where, inputType);

                case 5:
                  _context5.t3 = _context5.sent;
                  _context5.t4 = {};
                  _context5.t5 = context;
                  _context5.t6 = {
                    type: _context5.t1,
                    collection: _context5.t2,
                    selector: _context5.t3,
                    options: _context5.t4,
                    context: _context5.t5
                  };
                  return _context5.abrupt("return", _context5.t0.QueryExecutor.call(_context5.t0, _context5.t6));

                case 10:
                case "end":
                  return _context5.stop();
              }
            }
          }, _callee5, this);
        }));

        function resolve(_x17, _x18, _x19, _x20) {
          return _resolve5.apply(this, arguments);
        }

        return resolve;
      }()
    };
  });
  (0, _defineProperty2.default)(this, "_createUpdateMutation", function (modelType) {
    var whereType = _this._inputType(modelType, _inputTypes.INPUT_WHERE_UNIQUE);

    var updateType = _this._inputType(modelType, _inputTypes.INPUT_UPDATE);

    var args = [{
      type: new _graphql.GraphQLNonNull(updateType),
      name: 'data'
    }, {
      type: new _graphql.GraphQLNonNull(whereType),
      name: 'where'
    }];
    var name = "update".concat(modelType.name);
    _this.Mutation._fields[name] = {
      type: modelType,
      args: args,
      isDeprecated: false,
      name: name,
      resolve: function () {
        var _resolve6 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee6(parent, args, context, info) {
          return _regenerator.default.wrap(function _callee6$(_context6) {
            while (1) {
              switch (_context6.prev = _context6.next) {
                case 0:
                  _context6.t0 = _this;
                  _context6.t1 = _queryExecutor.UPDATE_ONE;
                  _context6.t2 = modelType.name;
                  _context6.next = 5;
                  return (0, _inputTypes.applyInputTransform)(args.where, whereType);

                case 5:
                  _context6.t3 = _context6.sent;
                  _context6.next = 8;
                  return (0, _inputTypes.applyInputTransform)(args.data, updateType);

                case 8:
                  _context6.t4 = _context6.sent;
                  _context6.t5 = {};
                  _context6.t6 = context;
                  _context6.t7 = {
                    type: _context6.t1,
                    collection: _context6.t2,
                    selector: _context6.t3,
                    doc: _context6.t4,
                    options: _context6.t5,
                    context: _context6.t6
                  };
                  return _context6.abrupt("return", _context6.t0.QueryExecutor.call(_context6.t0, _context6.t7));

                case 13:
                case "end":
                  return _context6.stop();
              }
            }
          }, _callee6, this);
        }));

        function resolve(_x21, _x22, _x23, _x24) {
          return _resolve6.apply(this, arguments);
        }

        return resolve;
      }()
    };
  });
  (0, _defineProperty2.default)(this, "_onSchemaInit", function (type) {
    _lodash.default.values(type._fields).forEach(function (field) {
      if (field.mmOnSchemaInit) {
        field.mmOnSchemaInit(field);
      }
    });
  });
  (0, _defineProperty2.default)(this, "_onTypeInit", function (type) {
    var init = _this.TypesInit[type.name];

    if (init) {
      init(type);
    }
  });
  (0, _defineProperty2.default)(this, "_onFieldsInit", function (type) {
    _lodash.default.values(type._fields).forEach(function (field) {
      var lastType = (0, _utils.getLastType)(field.type);
      var init = _this.FieldsInit[lastType.name];

      if (init) {
        init(field, {
          types: _this.SchemaTypes
        });
      }
    });
  });
  (0, _defineProperty2.default)(this, "makeExecutablSchema",
  /*#__PURE__*/
  function () {
    var _ref2 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee7(params) {
      var _params$schemaDirecti, schemaDirectives, _params$directiveReso, directiveResolvers, _params$resolvers, resolvers, _params$typeDefs, typeDefs, modelParams, schema, _schema, SchemaTypes, Query, Mutation;

      return _regenerator.default.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              _params$schemaDirecti = params.schemaDirectives, schemaDirectives = _params$schemaDirecti === void 0 ? {} : _params$schemaDirecti, _params$directiveReso = params.directiveResolvers, directiveResolvers = _params$directiveReso === void 0 ? {} : _params$directiveReso, _params$resolvers = params.resolvers, resolvers = _params$resolvers === void 0 ? {} : _params$resolvers, _params$typeDefs = params.typeDefs, typeDefs = _params$typeDefs === void 0 ? [] : _params$typeDefs;
              if (!_lodash.default.isArray(typeDefs)) typeDefs = [typeDefs];
              typeDefs = [_initialScheme.default, _readOnly.ReadOnlyScheme, _model.ModelScheme, _db.DirectiveDBScheme, _relation.RelationScheme, _id.IDScheme, _unique.UniqueScheme, // GeoJSONScheme,
              _extRelation.ExtRelationScheme].concat((0, _toConsumableArray2.default)(_scalars.typeDefs), (0, _toConsumableArray2.default)(typeDefs));
              schemaDirectives = (0, _objectSpread2.default)({}, schemaDirectives, {
                relation: (0, _relation.default)(_this.QueryExecutor),
                extRelation: (0, _extRelation.default)(_this.QueryExecutor),
                db: _db.default,
                model: _model.default,
                readOnly: _readOnly.default,
                unique: _unique.default,
                id: _id.default
              });
              directiveResolvers = (0, _objectSpread2.default)({}, directiveResolvers, {
                db: _db.DirectiveDBResolver
              });
              resolvers = (0, _objectSpread2.default)({}, resolvers, _scalars.default);
              modelParams = (0, _objectSpread2.default)({}, params, {
                typeDefs: typeDefs,
                schemaDirectives: schemaDirectives,
                directiveResolvers: directiveResolvers,
                resolvers: resolvers
              });

              _this.Modules.forEach(function (module) {
                if (module.typeDef) typeDefs.push(module.typeDef);
                if (module.resolvers) resolvers = _lodash.default.merge(resolvers, module.resolvers);
                if (module.typesInit) _this.TypesInit = _lodash.default.merge(_this.TypesInit, module.typesInit);
                if (module.fieldsInit) _this.FieldsInit = _lodash.default.merge(_this.FieldsInit, module.fieldsInit);
              });

              schema = (0, _graphqlTools.makeExecutableSchema)(modelParams); // console.warn('before');
              // console.log(schema);
              // schema = mergeSchemas({
              //   schemas: [schema],
              // });

              schema = _lodash.default.merge(schema, _lodash.default.pick(GeoJSONModule, ['_directives', '_typeMap'])); // console.warn('after');
              // console.log(schema);

              _schema = schema, SchemaTypes = _schema._typeMap;
              Query = SchemaTypes.Query, Mutation = SchemaTypes.Mutation;
              _this.InputTypes = new _inputTypes.default({
                SchemaTypes: SchemaTypes
              });
              _this.SchemaTypes = SchemaTypes;
              _this.Query = Query;
              _this.Mutation = Mutation;

              _lodash.default.values(SchemaTypes).forEach(function (type) {
                _this._onTypeInit(type);
              });

              _lodash.default.values(SchemaTypes).forEach(function (type) {
                _this._onFieldsInit(type);
              });

              _lodash.default.values(SchemaTypes).forEach(function (type) {
                _this._onSchemaInit(type);

                if ((0, _utils.getDirective)(type, 'model')) {
                  _this._createAllQuery(type);

                  _this._createSingleQuery(type);

                  _this._createMetaQuery(type);

                  _this._createCreateMutation(type);

                  _this._createDeleteMutation(type);

                  _this._createUpdateMutation(type);
                }
              });

              _context7.next = 21;
              return Promise.all(_lodash.default.values(SchemaTypes).filter(function (item) {
                return item.mmFill;
              }).map(function (item) {
                return item.mmFill;
              }));

            case 21:
              return _context7.abrupt("return", schema);

            case 22:
            case "end":
              return _context7.stop();
          }
        }
      }, _callee7, this);
    }));

    return function (_x25) {
      return _ref2.apply(this, arguments);
    };
  }());
  this.QueryExecutor = queryExecutor;
  this.Modules = [GeoJSONModule];
  this.TypesInit = {};
  this.FieldsInit = {};
};

exports.default = ModelMongo;