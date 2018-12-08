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
Object.defineProperty(exports, "FIND", {
  enumerable: true,
  get: function get() {
    return _utils.FIND;
  }
});
Object.defineProperty(exports, "FIND_ONE", {
  enumerable: true,
  get: function get() {
    return _utils.FIND_ONE;
  }
});
Object.defineProperty(exports, "DISTINCT", {
  enumerable: true,
  get: function get() {
    return _utils.DISTINCT;
  }
});
Object.defineProperty(exports, "COUNT", {
  enumerable: true,
  get: function get() {
    return _utils.COUNT;
  }
});
Object.defineProperty(exports, "INSERT", {
  enumerable: true,
  get: function get() {
    return _utils.INSERT;
  }
});
Object.defineProperty(exports, "REMOVE", {
  enumerable: true,
  get: function get() {
    return _utils.REMOVE;
  }
});
Object.defineProperty(exports, "UPDATE", {
  enumerable: true,
  get: function get() {
    return _utils.UPDATE;
  }
});
Object.defineProperty(exports, "getInputType", {
  enumerable: true,
  get: function get() {
    return _utils.getInputType;
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

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _graphqlTools = require("graphql-tools");

var _graphqlTag = _interopRequireDefault(require("graphql-tag"));

var _graphql = require("graphql");

var _lodash = _interopRequireDefault(require("lodash"));

var _pluralize = _interopRequireDefault(require("pluralize"));

var _queryExecutor = _interopRequireDefault(require("./queryExecutor.js"));

var _utils = require("./utils");

var _relation = _interopRequireWildcard(require("./relation"));

var _renameDB = _interopRequireWildcard(require("./renameDB"));

var _model = _interopRequireWildcard(require("./model"));

var _readOnly = _interopRequireWildcard(require("./readOnly"));

var _unique = _interopRequireWildcard(require("./unique"));

var _geoJSON = _interopRequireWildcard(require("./geoJSON"));

var _scalars = _interopRequireWildcard(require("./scalars"));

var relationFieldDefault = '_id';
var Modifiers = {
  Boolean: ['', 'not', 'exists'],
  ID: ['', 'in', 'not_in', 'exists'],
  Int: ['', 'in', 'not_in', 'lt', 'lte', 'gt', 'gte', 'exists'],
  String: ['', 'not', 'in', 'not_in', 'lt', 'lte', 'gt', 'gte', 'contains', 'not_contains', 'starts_with', 'not_starts_with', 'ends_with', 'not_ends_with', 'exists'],
  GeoJSONPoint: ['near']
};

var _default = function _default(params, _ref) {
  var queryExecutor = _ref.queryExecutor;
  var _params$schemaDirecti = params.schemaDirectives,
      schemaDirectives = _params$schemaDirecti === void 0 ? {} : _params$schemaDirecti,
      _params$directiveReso = params.directiveResolvers,
      directiveResolvers = _params$directiveReso === void 0 ? {} : _params$directiveReso,
      _params$resolvers = params.resolvers,
      resolvers = _params$resolvers === void 0 ? {} : _params$resolvers,
      _params$typeDefs = params.typeDefs,
      typeDefs = _params$typeDefs === void 0 ? [] : _params$typeDefs;
  if (!_lodash.default.isArray(typeDefs)) typeDefs = [typeDefs];
  typeDefs = [_readOnly.ReadOnlyScheme, _model.ModelScheme, _renameDB.RenameDBScheme, _relation.RelationScheme, _unique.UniqueScheme, _geoJSON.typeDef].concat((0, _toConsumableArray2.default)(_scalars.typeDefs), (0, _toConsumableArray2.default)(typeDefs));
  schemaDirectives = (0, _objectSpread2.default)({}, schemaDirectives, {
    relation: (0, _relation.default)(queryExecutor),
    renameDB: _renameDB.default,
    model: _model.default,
    readOnly: _readOnly.default,
    unique: _unique.default
  });
  directiveResolvers = (0, _objectSpread2.default)({}, directiveResolvers, {
    renameDB: _renameDB.RenameDBResolver
  });
  resolvers = (0, _objectSpread2.default)({}, resolvers, _geoJSON.default, _scalars.default);
  var modelParams = (0, _objectSpread2.default)({}, params, {
    typeDefs: typeDefs,
    schemaDirectives: schemaDirectives,
    directiveResolvers: directiveResolvers,
    resolvers: resolvers
  });
  var schema = (0, _graphqlTools.makeExecutableSchema)(modelParams);
  var SchemaTypes = schema._typeMap;
  var Query = SchemaTypes.Query,
      Mutation = SchemaTypes.Mutation,
      _QueryMeta = SchemaTypes._QueryMeta;

  _lodash.default.keys(SchemaTypes).forEach(function (key) {
    var modelType = SchemaTypes[key];

    if ((0, _utils.getDirective)(modelType, 'model')) {
      var filterType = createFilterType(modelType, SchemaTypes);
      var orderByType = createOrderByType(modelType, SchemaTypes);
      createAllQuery(modelType, Query, {
        filterType: filterType,
        orderByType: orderByType
      });
      createMetaQuery(modelType, Query, {
        filterType: filterType,
        orderByType: orderByType,
        _QueryMeta: _QueryMeta
      });
      createSingleQuery(modelType, Query);
      createCreateMutation(modelType, {
        Mutation: Mutation,
        SchemaTypes: SchemaTypes
      });
      createDeleteMutator(modelType, {
        Mutation: Mutation,
        SchemaTypes: SchemaTypes
      });
      createUpdateMutator(modelType, {
        Mutation: Mutation,
        SchemaTypes: SchemaTypes
      });
    }
  });

  function createFilterType(modelType, SchemaTypes) {
    var delayedCreateTypes = [];
    var name = "".concat(modelType.name, "Filter");

    if (SchemaTypes[name] && _lodash.default.keys(SchemaTypes[name]._fields).length > 0) {
      return SchemaTypes[name];
    }

    var fields = {};

    _lodash.default.keys(modelType._fields).forEach(function (key) {
      var field = modelType._fields[key];

      if (field.skipFilter) {
        return;
      }

      var type = (0, _utils.getLastType)(field.type);
      var isMany = (0, _utils.hasQLListType)(field.type);
      var modifiers = Modifiers[type.name] || [];
      field = _lodash.default.omit(field, 'resolve');
      field.type = type;
      var _field = field,
          resolveMapFilterToSelector = _field.resolveMapFilterToSelector;

      if (type.name == 'GeoJSONPoint') {
        var _filterType = (0, _utils.getInputType)("GeoJSONPointNearInput", SchemaTypes);

        field = (0, _objectSpread2.default)({}, field, {
          type: _filterType
        });
      } else if (type instanceof _graphql.GraphQLObjectType) {
        var _filterType2 = (0, _utils.getInputType)("".concat(type.name, "Filter"), SchemaTypes);

        delayedCreateTypes.push(type);
        field = (0, _objectSpread2.default)({}, field, {
          type: _filterType2
        });

        if (!(0, _utils.getDirective)(field, 'relation')) {
          field.resolveMapFilterToSelector =
          /*#__PURE__*/
          function () {
            var _ref2 = (0, _asyncToGenerator2.default)(
            /*#__PURE__*/
            _regenerator.default.mark(function _callee2(params) {
              return _regenerator.default.wrap(function _callee2$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      if (!resolveMapFilterToSelector) {
                        _context2.next = 4;
                        break;
                      }

                      _context2.next = 3;
                      return resolveMapFilterToSelector(params);

                    case 3:
                      params = _context2.sent;

                    case 4:
                      return _context2.abrupt("return", _lodash.default.flatten(Promise.all(params.map(
                      /*#__PURE__*/
                      function () {
                        var _ref4 = (0, _asyncToGenerator2.default)(
                        /*#__PURE__*/
                        _regenerator.default.mark(function _callee(_ref3) {
                          var _ref3$fieldName, fieldName, value, mapSelector;

                          return _regenerator.default.wrap(function _callee$(_context) {
                            while (1) {
                              switch (_context.prev = _context.next) {
                                case 0:
                                  _ref3$fieldName = _ref3.fieldName, fieldName = _ref3$fieldName === void 0 ? key : _ref3$fieldName, value = _ref3.value;
                                  _context.next = 3;
                                  return (0, _utils.mapFiltersToSelector)(value, _filterType2._fields);

                                case 3:
                                  mapSelector = _context.sent;
                                  return _context.abrupt("return", _lodash.default.keys(mapSelector).map(function (selectorKey) {
                                    return {
                                      fieldName: ["".concat(fieldName, ".").concat(selectorKey)],
                                      value: mapSelector[selectorKey]
                                    };
                                  }));

                                case 5:
                                case "end":
                                  return _context.stop();
                              }
                            }
                          }, _callee, this);
                        }));

                        return function (_x2) {
                          return _ref4.apply(this, arguments);
                        };
                      }()))));

                    case 5:
                    case "end":
                      return _context2.stop();
                  }
                }
              }, _callee2, this);
            }));

            return function (_x) {
              return _ref2.apply(this, arguments);
            };
          }();
        }

        if (isMany) {
          modifiers = ['some', 'every', 'none'];
        } else {
          modifiers = [''];
        }
      } //////


      modifiers.forEach(function (modifier) {
        var fieldName = key;

        if (modifier != '') {
          fieldName = "".concat(key, "_").concat(modifier);
        }

        var fieldType = field.type;

        if (modifier == 'in' || modifier == 'not_in') {
          fieldType = new _graphql.GraphQLList(new _graphql.GraphQLNonNull(field.type));
        } else if (modifier == 'exists') {
          fieldType = _graphql.GraphQLBoolean;
        }

        fields[fieldName] = AddResolveMapFilterToSelector((0, _objectSpread2.default)({}, field, {
          type: fieldType,
          name: fieldName
        }), key, modifier);
      });
    });

    var filterType = (0, _utils.getInputType)(name, SchemaTypes);

    if (name != 'GeoJSONPointNearFilter') {
      ['AND', 'OR'].forEach(function (modifier) {
        fields[modifier] = {
          type: new _graphql.GraphQLList(new _graphql.GraphQLNonNull(filterType)),
          args: [],
          name: modifier,
          resolveMapFilterToSelector: function () {
            var _resolveMapFilterToSelector = (0, _asyncToGenerator2.default)(
            /*#__PURE__*/
            _regenerator.default.mark(function _callee4(params) {
              return _regenerator.default.wrap(function _callee4$(_context4) {
                while (1) {
                  switch (_context4.prev = _context4.next) {
                    case 0:
                      return _context4.abrupt("return", params.map(function (param) {
                        return {
                          fieldName: "$".concat(modifier.toLowerCase()),
                          value: Promise.all(param.value.map(
                          /*#__PURE__*/
                          function () {
                            var _ref5 = (0, _asyncToGenerator2.default)(
                            /*#__PURE__*/
                            _regenerator.default.mark(function _callee3(val) {
                              return _regenerator.default.wrap(function _callee3$(_context3) {
                                while (1) {
                                  switch (_context3.prev = _context3.next) {
                                    case 0:
                                      _context3.next = 2;
                                      return (0, _utils.mapFiltersToSelector)(val, filterType._fields);

                                    case 2:
                                      return _context3.abrupt("return", _context3.sent);

                                    case 3:
                                    case "end":
                                      return _context3.stop();
                                  }
                                }
                              }, _callee3, this);
                            }));

                            return function (_x4) {
                              return _ref5.apply(this, arguments);
                            };
                          }()))
                        };
                      }));

                    case 1:
                    case "end":
                      return _context4.stop();
                  }
                }
              }, _callee4, this);
            }));

            function resolveMapFilterToSelector(_x3) {
              return _resolveMapFilterToSelector.apply(this, arguments);
            }

            return resolveMapFilterToSelector;
          }()
        };
      });
    }

    filterType._fields = fields;
    SchemaTypes[name] = filterType;
    delayedCreateTypes.forEach(function (type) {
      createFilterType(type, SchemaTypes);
    });
    return filterType;
  }

  function AddResolveMapFilterToSelector(field, defaultName, modifier) {
    var resolveMapFilterToSelector = field.resolveMapFilterToSelector;

    field.resolveMapFilterToSelector =
    /*#__PURE__*/
    function () {
      var _ref6 = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee5(params) {
        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (!resolveMapFilterToSelector) {
                  _context5.next = 4;
                  break;
                }

                _context5.next = 3;
                return resolveMapFilterToSelector(params);

              case 3:
                params = _context5.sent;

              case 4:
                return _context5.abrupt("return", params.map(function (_ref7) {
                  var _ref7$fieldName = _ref7.fieldName,
                      fieldName = _ref7$fieldName === void 0 ? defaultName : _ref7$fieldName,
                      value = _ref7.value;
                  return {
                    fieldName: fieldName,
                    value: mapModifier(modifier, value)
                  };
                }));

              case 5:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      return function (_x5) {
        return _ref6.apply(this, arguments);
      };
    }();

    return field;
  }

  function createOrderByType(modelType, SchemaTypes) {
    var name = "".concat(modelType.name, "OrderBy");
    var values = {};
    var i = 0;

    _lodash.default.keys(modelType._fields).forEach(function (key) {
      values["".concat(key, "_ASC")] = {
        value: (0, _defineProperty2.default)({}, key, 1)
      };
      values["".concat(key, "_DESC")] = {
        value: (0, _defineProperty2.default)({}, key, -1)
      };
      i += 2;
    });

    return SchemaTypes[name] = new _graphql.GraphQLEnumType({
      name: name,
      values: values
    });
  }

  function mapModifier(modifier, value) {
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

      case 'near':
        return {
          $near: {
            $geometry: value.geometry,
            $minDistance: value.minDistance,
            $maxDistance: value.maxDistance
          }
        };

      default:
        return {};
    }
  }

  function createAllQuery(modelType, Query, _ref9) {
    var filterType = _ref9.filterType,
        orderByType = _ref9.orderByType;
    var name = "all".concat((0, _pluralize.default)(modelType.name));
    Query._fields[name] = {
      type: new _graphql.GraphQLNonNull(new _graphql.GraphQLList(new _graphql.GraphQLNonNull(modelType))),
      description: undefined,
      args: (0, _utils.allQueryArgs)({
        filterType: filterType,
        orderByType: orderByType
      }),
      deprecationReason: undefined,
      isDeprecated: false,
      name: name,
      resolve: function () {
        var _resolve = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee6(parent, args, context, info) {
          return _regenerator.default.wrap(function _callee6$(_context6) {
            while (1) {
              switch (_context6.prev = _context6.next) {
                case 0:
                  _context6.t0 = queryExecutor;
                  _context6.t1 = _utils.FIND;
                  _context6.t2 = modelType.name;
                  _context6.next = 5;
                  return (0, _utils.mapFiltersToSelector)(args.where, filterType._fields);

                case 5:
                  _context6.t3 = _context6.sent;
                  _context6.t4 = {
                    skip: args.skip,
                    limit: args.first,
                    sort: args.orderBy
                  };
                  _context6.t5 = context;
                  _context6.t6 = {
                    type: _context6.t1,
                    collection: _context6.t2,
                    selector: _context6.t3,
                    options: _context6.t4,
                    context: _context6.t5
                  };
                  return _context6.abrupt("return", (0, _context6.t0)(_context6.t6));

                case 10:
                case "end":
                  return _context6.stop();
              }
            }
          }, _callee6, this);
        }));

        function resolve(_x6, _x7, _x8, _x9) {
          return _resolve.apply(this, arguments);
        }

        return resolve;
      }()
    };
  }

  function createMetaQuery(modelType, Query, _ref10) {
    var filterType = _ref10.filterType,
        orderByType = _ref10.orderByType,
        _QueryMeta = _ref10._QueryMeta;
    var name = "_all".concat((0, _pluralize.default)(modelType.name), "Meta");
    Query._fields[name] = {
      type: _QueryMeta,
      description: undefined,
      args: (0, _utils.allQueryArgs)({
        filterType: filterType,
        orderByType: orderByType
      }),
      deprecationReason: undefined,
      isDeprecated: false,
      name: name,
      resolve: function () {
        var _resolve2 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee7(parent, args, context, info) {
          return _regenerator.default.wrap(function _callee7$(_context7) {
            while (1) {
              switch (_context7.prev = _context7.next) {
                case 0:
                  _context7.t0 = queryExecutor;
                  _context7.t1 = _utils.COUNT;
                  _context7.t2 = modelType.name;
                  _context7.next = 5;
                  return (0, _utils.mapFiltersToSelector)(args.where, filterType._fields);

                case 5:
                  _context7.t3 = _context7.sent;
                  _context7.t4 = {
                    skip: args.skip,
                    limit: args.first
                  };
                  _context7.t5 = context;
                  _context7.t6 = {
                    type: _context7.t1,
                    collection: _context7.t2,
                    selector: _context7.t3,
                    options: _context7.t4,
                    context: _context7.t5
                  };
                  _context7.t7 = (0, _context7.t0)(_context7.t6);
                  return _context7.abrupt("return", {
                    count: _context7.t7
                  });

                case 11:
                case "end":
                  return _context7.stop();
              }
            }
          }, _callee7, this);
        }));

        function resolve(_x10, _x11, _x12, _x13) {
          return _resolve2.apply(this, arguments);
        }

        return resolve;
      }()
    };
  }

  function createSingleQuery(modelType, Query) {
    var uniqueFields = _lodash.default.values(modelType._fields).filter(function (field) {
      return (0, _utils.getDirective)(field, 'unique');
    });

    if (uniqueFields.length > 0) {
      var argsObj = {};
      var argsArr = uniqueFields.map(function (field) {
        var newArg = _lodash.default.omit(field, 'resolve'); // {
        //   name: field.name,
        //   description: null,
        //   type: field.type,
        //   defaultValue: undefined
        //
        // };


        argsObj[field.name] = newArg;
        return newArg;
      });
      var name = modelType.name;
      Query._fields[name] = {
        type: modelType,
        description: undefined,
        args: argsArr,
        deprecationReason: undefined,
        isDeprecated: false,
        name: name,
        resolve: function () {
          var _resolve3 = (0, _asyncToGenerator2.default)(
          /*#__PURE__*/
          _regenerator.default.mark(function _callee8(parent, args, context, info) {
            return _regenerator.default.wrap(function _callee8$(_context8) {
              while (1) {
                switch (_context8.prev = _context8.next) {
                  case 0:
                    _context8.t0 = queryExecutor;
                    _context8.t1 = _utils.FIND_ONE;
                    _context8.t2 = modelType.name;
                    _context8.next = 5;
                    return (0, _utils.mapFiltersToSelector)(args, argsObj);

                  case 5:
                    _context8.t3 = _context8.sent;
                    _context8.t4 = {};
                    _context8.t5 = context;
                    _context8.t6 = {
                      type: _context8.t1,
                      collection: _context8.t2,
                      selector: _context8.t3,
                      options: _context8.t4,
                      context: _context8.t5
                    };
                    return _context8.abrupt("return", (0, _context8.t0)(_context8.t6));

                  case 10:
                  case "end":
                    return _context8.stop();
                }
              }
            }, _callee8, this);
          }));

          function resolve(_x14, _x15, _x16, _x17) {
            return _resolve3.apply(this, arguments);
          }

          return resolve;
        }()
      };
    }
  }

  function createInputType(type, SchemaTypes) {
    var delayedCreateTypes = [];
    var name = "".concat(type.name, "Input");
    if (SchemaTypes[name] && !_lodash.default.isEmpty(_lodash.default.keys(SchemaTypes[name]._fields))) return SchemaTypes[name];
    var inputType = (0, _utils.getInputType)("".concat(type.name, "Input"), SchemaTypes);

    _lodash.default.values(type._fields).forEach(function (field) {
      if (field.skipCreate) return;

      var newField = _lodash.default.omit(field, 'resolve');

      var newFieldType = newField.type;
      var lastType = (0, _utils.getLastType)(newFieldType);

      if (lastType instanceof _graphql.GraphQLObjectType) {
        delayedCreateTypes.push(lastType);
        lastType = (0, _utils.getInputType)("".concat(lastType.name, "Input"), SchemaTypes);
        newField.type = (0, _utils.cloneSchema)(newFieldType, lastType);
      }

      inputType._fields[field.name] = newField;
    });

    SchemaTypes[name] = inputType;
    delayedCreateTypes.forEach(function (type) {
      createInputType(type, SchemaTypes);
    });
    return inputType;
  }

  function createCreateMutation(modelType, _ref11) {
    var Mutation = _ref11.Mutation,
        SchemaTypes = _ref11.SchemaTypes;

    var argFields = _lodash.default.values(modelType._fields).filter(function (field) {
      return !field.skipCreate && !field.primaryKey;
    });

    var argsObj = {};
    var argsArr = argFields.map(function (field) {
      var newArg = _lodash.default.omit(field, 'resolve');

      var type = newArg.type;
      var lastType = (0, _utils.getLastType)(type);

      if (lastType instanceof _graphql.GraphQLObjectType) {
        type = (0, _utils.cloneSchema)(type, createInputType(lastType, SchemaTypes));
      }

      newArg.type = type;
      argsObj[field.name] = newArg;
      return newArg;
    });
    var name = "create".concat(modelType.name);
    Mutation._fields[name] = {
      type: modelType,
      args: argsArr,
      isDeprecated: false,
      name: name,
      resolve: function resolve(parent, args, context, info) {
        return queryExecutor({
          type: _utils.INSERT,
          collection: modelType.name,
          doc: args,
          options: {},
          context: context
        });
      }
    };
  }

  function createDeleteMutator(modelType, _ref12) {
    var Mutation = _ref12.Mutation,
        SchemaTypes = _ref12.SchemaTypes;

    var argFields = _lodash.default.values(modelType._fields).filter(function (field) {
      return field.primaryKey;
    });

    var argsObj = {};
    var argsArr = argFields.map(function (field) {
      var newArg = _lodash.default.omit(field, 'resolve');

      var type = newArg.type;
      var lastType = (0, _utils.getLastType)(type);

      if (lastType instanceof _graphql.GraphQLObjectType) {
        type = (0, _utils.cloneSchema)(type, createInputType(lastType, SchemaTypes));
      }

      newArg.type = type;
      argsObj[field.name] = newArg;
      return newArg;
    });
    var name = "delete".concat(modelType.name);
    Mutation._fields[name] = {
      type: modelType,
      args: argsArr,
      isDeprecated: false,
      name: name,
      resolve: function () {
        var _resolve4 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee9(parent, args, context, info) {
          return _regenerator.default.wrap(function _callee9$(_context9) {
            while (1) {
              switch (_context9.prev = _context9.next) {
                case 0:
                  _context9.t0 = queryExecutor;
                  _context9.t1 = _utils.REMOVE;
                  _context9.t2 = modelType.name;
                  _context9.next = 5;
                  return (0, _utils.mapFiltersToSelector)(args, argsObj);

                case 5:
                  _context9.t3 = _context9.sent;
                  _context9.t4 = {};
                  _context9.t5 = context;
                  _context9.t6 = {
                    type: _context9.t1,
                    collection: _context9.t2,
                    selector: _context9.t3,
                    options: _context9.t4,
                    context: _context9.t5
                  };
                  return _context9.abrupt("return", (0, _context9.t0)(_context9.t6));

                case 10:
                case "end":
                  return _context9.stop();
              }
            }
          }, _callee9, this);
        }));

        function resolve(_x18, _x19, _x20, _x21) {
          return _resolve4.apply(this, arguments);
        }

        return resolve;
      }()
    };
  }

  function createUpdateMutator(modelType, _ref13) {
    var Mutation = _ref13.Mutation,
        SchemaTypes = _ref13.SchemaTypes;

    var argFields = _lodash.default.values(modelType._fields).filter(function (field) {
      return !field.skipCreate || field.primaryKey;
    });

    var primaryKey;
    var argsObj = {};
    var argsArr = argFields.map(function (field) {
      if (field.primaryKey) primaryKey = field.name;

      var newArg = _lodash.default.omit(field, 'resolve');

      var type = newArg.type;
      var lastType = (0, _utils.getLastType)(type);

      if (lastType instanceof _graphql.GraphQLObjectType) {
        type = (0, _utils.cloneSchema)(type, createInputType(lastType, SchemaTypes));
      }

      newArg.type = type;
      argsObj[field.name] = newArg;
      return newArg;
    });
    var name = "update".concat(modelType.name);
    Mutation._fields[name] = {
      type: modelType,
      args: argsArr,
      isDeprecated: false,
      name: name,
      resolve: function () {
        var _resolve5 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee10(parent, args, context, info) {
          return _regenerator.default.wrap(function _callee10$(_context10) {
            while (1) {
              switch (_context10.prev = _context10.next) {
                case 0:
                  _context10.t0 = queryExecutor;
                  _context10.t1 = _utils.UPDATE;
                  _context10.t2 = modelType.name;
                  _context10.next = 5;
                  return (0, _utils.mapFiltersToSelector)(_lodash.default.pick(args, primaryKey), argsObj);

                case 5:
                  _context10.t3 = _context10.sent;
                  _context10.t4 = _lodash.default.omit(args, primaryKey);
                  _context10.t5 = {};
                  _context10.t6 = context;
                  _context10.t7 = {
                    type: _context10.t1,
                    collection: _context10.t2,
                    selector: _context10.t3,
                    doc: _context10.t4,
                    options: _context10.t5,
                    context: _context10.t6
                  };
                  return _context10.abrupt("return", (0, _context10.t0)(_context10.t7));

                case 11:
                case "end":
                  return _context10.stop();
              }
            }
          }, _callee10, this);
        }));

        function resolve(_x22, _x23, _x24, _x25) {
          return _resolve5.apply(this, arguments);
        }

        return resolve;
      }()
    };
  }

  return schema;
};

exports.default = _default;