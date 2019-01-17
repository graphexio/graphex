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

var _typeWrap = _interopRequireDefault(require("./typeWrap"));

var _initialScheme = _interopRequireDefault(require("./initialScheme"));

var _inherit = _interopRequireWildcard(require("./directives/inherit"));

var _relation = _interopRequireWildcard(require("./directives/relation"));

var _extRelation = _interopRequireWildcard(require("./directives/extRelation"));

var _db = _interopRequireWildcard(require("./directives/db"));

var _model = _interopRequireWildcard(require("./directives/model"));

var _unique = _interopRequireWildcard(require("./directives/unique"));

var _id = _interopRequireWildcard(require("./directives/id"));

var _scalars = _interopRequireWildcard(require("./scalars"));

var _modules = _interopRequireDefault(require("./modules"));

var _inputTypes = _interopRequireDefault(require("./inputTypes"));

var _utils2 = require("./inputTypes/utils");

var KIND = _interopRequireWildcard(require("./inputTypes/kinds"));

var relationFieldDefault = '_id';

var ModelMongo = function ModelMongo(_ref) {
  var _this = this;

  var queryExecutor = _ref.queryExecutor;
  (0, _classCallCheck2.default)(this, ModelMongo);
  (0, _defineProperty2.default)(this, "_inputType", function (type, target) {
    return _inputTypes.default.get(type, target);
  });
  (0, _defineProperty2.default)(this, "_createAllQuery", function (modelType) {
    var typeWrap = new _typeWrap.default(modelType);

    try {
      var whereType = _this._inputType(modelType, KIND.WHERE);

      var orderByType = _this._inputType(modelType, KIND.ORDER_BY);
    } catch (e) {
      return;
    }

    var name = (0, _utils.lowercaseFirstLetter)((0, _pluralize.default)(modelType.name));
    _this.Query._fields[name] = {
      type: new _graphql.GraphQLNonNull(new _graphql.GraphQLList(new _graphql.GraphQLNonNull(modelType))),
      args: (0, _utils.allQueryArgs)({
        whereType: whereType,
        orderByType: orderByType
      }),
      isDeprecated: false,
      name: name,
      resolve: function () {
        var _resolve = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee(parent, args, context, info) {
          var selector;
          return _regenerator.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.next = 2;
                  return (0, _utils2.applyInputTransform)(args.where, whereType);

                case 2:
                  selector = _context.sent;

                  if (typeWrap.isInherited()) {
                    selector[typeWrap.interfaceType().mmDiscriminatorField] = typeWrap.realType().mmDiscriminator;
                  }

                  return _context.abrupt("return", _this.QueryExecutor({
                    type: _queryExecutor.FIND,
                    collection: modelType.mmCollectionName,
                    selector: selector,
                    options: {
                      skip: args.skip,
                      limit: args.first,
                      sort: args.orderBy
                    },
                    context: context
                  }));

                case 5:
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
  (0, _defineProperty2.default)(this, "_createAggregateAndConnectionTypes", function (modelType) {
    var typeWrap = new _typeWrap.default(modelType);

    try {
      var whereType = _this._inputType(modelType, KIND.WHERE);

      var orderByType = _this._inputType(modelType, KIND.ORDER_BY);
    } catch (e) {
      return;
    }

    var aggregateTypeName = "Aggregate".concat(modelType.name);
    _this.SchemaTypes[aggregateTypeName] = new _graphql.GraphQLObjectType({
      name: aggregateTypeName,
      fields: {
        count: {
          name: 'count',
          type: new _graphql.GraphQLNonNull(_graphql.GraphQLInt),
          resolve: function () {
            var _resolve2 = (0, _asyncToGenerator2.default)(
            /*#__PURE__*/
            _regenerator.default.mark(function _callee2(parent, args, context, info) {
              var selector;
              return _regenerator.default.wrap(function _callee2$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      selector = parent._selector;

                      if (typeWrap.isInherited()) {
                        selector[typeWrap.interfaceType().mmDiscriminatorField] = typeWrap.realType().mmDiscriminator;
                      }

                      return _context2.abrupt("return", _this.QueryExecutor({
                        type: _queryExecutor.COUNT,
                        collection: modelType.mmCollectionName,
                        selector: selector,
                        options: {
                          skip: parent._skip,
                          limit: parent._limit
                        },
                        context: context
                      }));

                    case 3:
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
        }
      }
    });
    var connectionTypeName = "".concat(modelType.name, "Connection");
    _this.SchemaTypes[connectionTypeName] = new _graphql.GraphQLObjectType({
      name: connectionTypeName,
      fields: {
        aggregate: {
          name: 'aggregate',
          type: new _graphql.GraphQLNonNull(_this.SchemaTypes[aggregateTypeName]),
          resolve: function () {
            var _resolve3 = (0, _asyncToGenerator2.default)(
            /*#__PURE__*/
            _regenerator.default.mark(function _callee3(parent, args, context, info) {
              return _regenerator.default.wrap(function _callee3$(_context3) {
                while (1) {
                  switch (_context3.prev = _context3.next) {
                    case 0:
                      return _context3.abrupt("return", parent);

                    case 1:
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
        }
      }
    });
  });
  (0, _defineProperty2.default)(this, "_createConnectionQuery", function (modelType) {
    var typeWrap = new _typeWrap.default(modelType);

    try {
      var whereType = _this._inputType(modelType, KIND.WHERE);

      var orderByType = _this._inputType(modelType, KIND.ORDER_BY);
    } catch (e) {
      return;
    }

    var connectionTypeName = "".concat(modelType.name, "Connection");
    var name = "".concat((0, _utils.lowercaseFirstLetter)((0, _pluralize.default)(modelType.name)), "Connection");
    _this.Query._fields[name] = {
      type: _this.SchemaTypes[connectionTypeName],
      args: (0, _utils.allQueryArgs)({
        whereType: whereType,
        orderByType: orderByType
      }),
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
                  _context4.next = 2;
                  return (0, _utils2.applyInputTransform)(args.where, whereType);

                case 2:
                  _context4.t0 = _context4.sent;
                  _context4.t1 = args.skip;
                  _context4.t2 = args.first;
                  return _context4.abrupt("return", {
                    _selector: _context4.t0,
                    _skip: _context4.t1,
                    _limit: _context4.t2
                  });

                case 6:
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
  (0, _defineProperty2.default)(this, "_createSingleQuery", function (modelType) {
    var typeWrap = new _typeWrap.default(modelType);

    try {
      var orderByType = _this._inputType(modelType, KIND.ORDER_BY);

      var whereUniqueType = _this._inputType(modelType, KIND.WHERE_UNIQUE);
    } catch (e) {
      return;
    }

    var args = [{
      name: 'where',
      type: whereUniqueType
    }];
    var name = (0, _utils.lowercaseFirstLetter)(modelType.name);
    _this.Query._fields[name] = {
      type: modelType,
      description: undefined,
      args: args,
      deprecationReason: undefined,
      isDeprecated: false,
      name: name,
      resolve: function () {
        var _resolve5 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee5(parent, args, context, info) {
          var selector;
          return _regenerator.default.wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  _context5.next = 2;
                  return (0, _utils2.applyInputTransform)(args.where, whereUniqueType);

                case 2:
                  selector = _context5.sent;

                  if (typeWrap.isInherited()) {
                    selector[typeWrap.interfaceType().mmDiscriminatorField] = typeWrap.realType().mmDiscriminator;
                  }

                  return _context5.abrupt("return", _this.QueryExecutor({
                    type: _queryExecutor.FIND_ONE,
                    collection: modelType.mmCollectionName,
                    selector: selector,
                    options: {},
                    context: context
                  }));

                case 5:
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
  (0, _defineProperty2.default)(this, "_createCreateMutation", function (modelType) {
    var typeWrap = new _typeWrap.default(modelType);
    var args = [];

    try {
      var inputType = _this._inputType(modelType, KIND.CREATE);

      args = [{
        type: new _graphql.GraphQLNonNull(inputType),
        name: 'data'
      }];
    } catch (e) {}

    var name = "create".concat(modelType.name);
    _this.Mutation._fields[name] = {
      type: modelType,
      args: args,
      isDeprecated: false,
      name: name,
      resolve: function () {
        var _resolve6 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee6(parent, args, context, info) {
          var doc;
          return _regenerator.default.wrap(function _callee6$(_context6) {
            while (1) {
              switch (_context6.prev = _context6.next) {
                case 0:
                  _context6.next = 2;
                  return (0, _utils2.applyInputTransform)(args.data, inputType);

                case 2:
                  doc = _context6.sent;

                  if (typeWrap.isInherited()) {
                    doc[typeWrap.interfaceType().mmDiscriminatorField] = typeWrap.realType().mmDiscriminator;
                  }

                  return _context6.abrupt("return", _this.QueryExecutor({
                    type: _queryExecutor.INSERT_ONE,
                    collection: modelType.mmCollectionName,
                    doc: doc,
                    options: {},
                    context: context
                  }));

                case 5:
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
  (0, _defineProperty2.default)(this, "_createDeleteMutation", function (modelType) {
    var typeWrap = new _typeWrap.default(modelType);

    try {
      var whereUniqueType = _this._inputType(modelType, KIND.WHERE_UNIQUE);
    } catch (e) {
      return;
    }

    var args = [{
      type: new _graphql.GraphQLNonNull(whereUniqueType),
      name: 'where'
    }];
    var name = "delete".concat(modelType.name);
    _this.Mutation._fields[name] = {
      type: modelType,
      args: args,
      isDeprecated: false,
      name: name,
      resolve: function () {
        var _resolve7 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee7(parent, args, context, info) {
          var selector;
          return _regenerator.default.wrap(function _callee7$(_context7) {
            while (1) {
              switch (_context7.prev = _context7.next) {
                case 0:
                  _context7.next = 2;
                  return (0, _utils2.applyInputTransform)(args.where, whereUniqueType);

                case 2:
                  selector = _context7.sent;

                  if (typeWrap.isInherited()) {
                    selector[typeWrap.interfaceType().mmDiscriminatorField] = typeWrap.realType().mmDiscriminator;
                  }

                  return _context7.abrupt("return", _this.QueryExecutor({
                    type: _queryExecutor.DELETE_ONE,
                    collection: modelType.mmCollectionName,
                    selector: selector,
                    options: {},
                    context: context
                  }));

                case 5:
                case "end":
                  return _context7.stop();
              }
            }
          }, _callee7, this);
        }));

        function resolve(_x25, _x26, _x27, _x28) {
          return _resolve7.apply(this, arguments);
        }

        return resolve;
      }()
    };
  });
  (0, _defineProperty2.default)(this, "_createUpdateMutation", function (modelType) {
    var typeWrap = new _typeWrap.default(modelType);
    var args = [];

    try {
      var whereType = _this._inputType(modelType, KIND.WHERE_UNIQUE);

      var updateType = _this._inputType(modelType, KIND.UPDATE);
    } catch (e) {
      return;
    }

    args = [{
      type: new _graphql.GraphQLNonNull(updateType),
      name: 'data'
    }, {
      type: new _graphql.GraphQLNonNull(whereType),
      name: 'where'
    }]; // }

    var name = "update".concat(modelType.name);
    _this.Mutation._fields[name] = {
      type: modelType,
      args: args,
      isDeprecated: false,
      name: name,
      resolve: function () {
        var _resolve8 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee8(parent, args, context, info) {
          var _prepareUpdateDoc, doc, validations, arrayFilters, selector;

          return _regenerator.default.wrap(function _callee8$(_context8) {
            while (1) {
              switch (_context8.prev = _context8.next) {
                case 0:
                  _context8.t0 = _utils.prepareUpdateDoc;
                  _context8.next = 3;
                  return (0, _utils2.applyInputTransform)(args.data, updateType);

                case 3:
                  _context8.t1 = _context8.sent;
                  _prepareUpdateDoc = (0, _context8.t0)(_context8.t1);
                  doc = _prepareUpdateDoc.doc;
                  validations = _prepareUpdateDoc.validations;
                  arrayFilters = _prepareUpdateDoc.arrayFilters;
                  _context8.next = 10;
                  return (0, _utils2.applyInputTransform)(args.where, whereType);

                case 10:
                  _context8.t2 = _context8.sent;
                  _context8.t3 = validations;
                  _context8.t4 = [_context8.t2, _context8.t3];
                  selector = {
                    $and: _context8.t4
                  };

                  if (typeWrap.isInherited()) {
                    selector[typeWrap.interfaceType().mmDiscriminatorField] = typeWrap.realType().mmDiscriminator;
                  }

                  return _context8.abrupt("return", _this.QueryExecutor({
                    type: _queryExecutor.UPDATE_ONE,
                    collection: modelType.mmCollectionName,
                    selector: selector,
                    doc: doc,
                    options: {
                      arrayFilters: arrayFilters
                    },
                    context: context
                  }));

                case 16:
                case "end":
                  return _context8.stop();
              }
            }
          }, _callee8, this);
        }));

        function resolve(_x29, _x30, _x31, _x32) {
          return _resolve8.apply(this, arguments);
        }

        return resolve;
      }()
    };
  });
  (0, _defineProperty2.default)(this, "_onSchemaInit", function (type) {
    if (type.mmOnSchemaInit) {
      type.mmOnSchemaInit({
        type: type,
        inputTypes: _inputTypes.default
      });
    }

    _lodash.default.values(type._fields).forEach(function (field) {
      if (field.mmOnSchemaInit) {
        field.mmOnSchemaInit({
          field: field,
          inputTypes: _inputTypes.default
        });
      }
    });
  });
  (0, _defineProperty2.default)(this, "_onSchemaBuild", function (type) {
    if (type.mmOnSchemaBuild) {
      type.mmOnSchemaBuild({
        type: type,
        inputTypes: _inputTypes.default
      });
    }

    _lodash.default.values(type._fields).forEach(function (field) {
      if (field.mmOnSchemaBuild) {
        field.mmOnSchemaBuild({
          field: field,
          inputTypes: _inputTypes.default
        });
      }
    });
  });
  (0, _defineProperty2.default)(this, "_onTypeInit", function (type) {
    var init = _this.TypesInit[type.name];

    if (init) {
      init({
        type: type,
        inputTypes: _inputTypes.default
      });
    }
  });
  (0, _defineProperty2.default)(this, "_onFieldsInit", function (type) {
    _lodash.default.values(type._fields).forEach(function (field) {
      var lastType = (0, _utils.getLastType)(field.type);
      var init = _this.FieldsInit[lastType.name];

      if (init) {
        init({
          field: field,
          inputTypes: _inputTypes.default
        });
      }
    });
  });
  (0, _defineProperty2.default)(this, "makeExecutablSchema", function (params) {
    var _params$schemaDirecti = params.schemaDirectives,
        schemaDirectives = _params$schemaDirecti === void 0 ? {} : _params$schemaDirecti,
        _params$directiveReso = params.directiveResolvers,
        directiveResolvers = _params$directiveReso === void 0 ? {} : _params$directiveReso,
        _params$resolvers = params.resolvers,
        resolvers = _params$resolvers === void 0 ? {} : _params$resolvers,
        _params$typeDefs = params.typeDefs,
        typeDefs = _params$typeDefs === void 0 ? [] : _params$typeDefs;
    if (!_lodash.default.isArray(typeDefs)) typeDefs = [typeDefs];
    typeDefs = [_initialScheme.default, _inherit.InheritScheme, _model.ModelScheme, _db.DirectiveDBScheme, _relation.RelationScheme, _id.IDScheme, _unique.UniqueScheme, _extRelation.ExtRelationScheme].concat((0, _toConsumableArray2.default)(_scalars.typeDefs), (0, _toConsumableArray2.default)(typeDefs));
    schemaDirectives = (0, _objectSpread2.default)({}, schemaDirectives, {
      relation: (0, _relation.default)(_this.QueryExecutor),
      extRelation: (0, _extRelation.default)(_this.QueryExecutor),
      db: _db.default,
      inherit: _inherit.default,
      model: _model.default,
      unique: _unique.default,
      id: _id.default
    });
    directiveResolvers = (0, _objectSpread2.default)({}, directiveResolvers, {
      db: _db.DirectiveDBResolver
    });
    resolvers = (0, _objectSpread2.default)({}, resolvers, _scalars.default);

    _this.Modules.forEach(function (module) {
      if (module.typeDef) typeDefs.push(module.typeDef);
      if (module.resolvers) resolvers = _lodash.default.merge(resolvers, module.resolvers);
      if (module.schemaDirectives) schemaDirectives = _lodash.default.merge(schemaDirectives, module.schemaDirectives);
      if (module.typesInit) _this.TypesInit = _lodash.default.merge(_this.TypesInit, module.typesInit);
      if (module.fieldsInit) _this.FieldsInit = _lodash.default.merge(_this.FieldsInit, module.fieldsInit);
    });

    var modelParams = (0, _objectSpread2.default)({}, params, {
      typeDefs: typeDefs,
      schemaDirectives: schemaDirectives,
      directiveResolvers: directiveResolvers,
      resolvers: resolvers
    });
    var schema = (0, _graphqlTools.makeExecutableSchema)(modelParams);
    var SchemaTypes = schema._typeMap;
    var Query = SchemaTypes.Query,
        Mutation = SchemaTypes.Mutation;
    _this.SchemaTypes = SchemaTypes;
    _this.Query = Query;
    _this.Mutation = Mutation;

    _lodash.default.values(SchemaTypes).forEach(function (type) {
      _this._onSchemaBuild(type);
    });

    _lodash.default.values(SchemaTypes).forEach(function (type) {
      _this._onTypeInit(type);
    });

    _lodash.default.values(SchemaTypes).forEach(function (type) {
      _this._onFieldsInit(type);
    });

    _lodash.default.values(SchemaTypes).forEach(function (type) {
      var typeWrap = new _typeWrap.default(type);

      if ((0, _utils.getDirective)(type, 'model') || typeWrap.isInherited() && (0, _utils.getDirective)(typeWrap.interfaceType(), 'model')) {
        _this._createAggregateAndConnectionTypes(type);
      }
    });

    _lodash.default.values(SchemaTypes).forEach(function (type) {
      _this._onSchemaInit(type);

      var typeWrap = new _typeWrap.default(type);

      if ((0, _utils.getDirective)(type, 'model') || typeWrap.isInherited() && (0, _utils.getDirective)(typeWrap.interfaceType(), 'model')) {
        _this._createAllQuery(type);

        _this._createSingleQuery(type);

        _this._createConnectionQuery(type);

        if (!typeWrap.isInterface()) {
          _this._createCreateMutation(type);
        }

        _this._createDeleteMutation(type);

        _this._createUpdateMutation(type); // }

      }
    });

    return schema;
  });
  this.QueryExecutor = queryExecutor;
  this.Modules = _modules.default;
  this.TypesInit = {};
  this.FieldsInit = {};
};

exports.default = ModelMongo;