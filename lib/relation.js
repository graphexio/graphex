"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.RelationScheme = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _objectSpread4 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _graphql = require("graphql");

var _graphqlTools = require("graphql-tools");

var _lodash = _interopRequireDefault(require("lodash"));

var _utils = require("./utils");

var RelationScheme = "directive @relation(field:String=\"_id\", externalField:String, fieldType:String=\"ObjectID\" ) on FIELD_DEFINITION";
exports.RelationScheme = RelationScheme;

var _default = function _default(queryExecutor) {
  return (
    /*#__PURE__*/
    function (_SchemaDirectiveVisit) {
      (0, _inherits2.default)(RelationDirective, _SchemaDirectiveVisit);

      function RelationDirective() {
        (0, _classCallCheck2.default)(this, RelationDirective);
        return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(RelationDirective).apply(this, arguments));
      }

      (0, _createClass2.default)(RelationDirective, [{
        key: "visitFieldDefinition",
        value: function visitFieldDefinition(field, _ref) {
          var _this = this;

          var objectType = _ref.objectType;
          // console.log(field.name, objectType);
          var _this$args = this.args,
              relationField = _this$args.field,
              externalField = _this$args.externalField,
              fieldType = _this$args.fieldType;
          var SchemaTypes = this.schema._typeMap;

          if (externalField) {
            field.skipFilter = true;
          }

          var lastType = (0, _utils.getLastType)(field.type);
          var isMany = (0, _utils.hasQLListType)(field.type);
          var collection = lastType.name; ///////map filter to selector

          var resolveMapFilterToSelector = field.resolveMapFilterToSelector;
          var filterType = (0, _utils.getInputType)("".concat(lastType, "Filter"), SchemaTypes);

          field.resolveMapFilterToSelector =
          /*#__PURE__*/
          function () {
            var _ref2 = (0, _asyncToGenerator2.default)(
            /*#__PURE__*/
            _regenerator.default.mark(function _callee2(params) {
              var res;
              return _regenerator.default.wrap(function _callee2$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      if (!resolveMapFilterToSelector) {
                        _context2.next = 4;
                        break;
                      }

                      _context2.next = 3;
                      return resolveMapFilterToSelector.apply(_this, params);

                    case 3:
                      params = _context2.sent;

                    case 4:
                      res = params.map(
                      /*#__PURE__*/
                      function () {
                        var _ref4 = (0, _asyncToGenerator2.default)(
                        /*#__PURE__*/
                        _regenerator.default.mark(function _callee(_ref3) {
                          var fieldName, value;
                          return _regenerator.default.wrap(function _callee$(_context) {
                            while (1) {
                              switch (_context.prev = _context.next) {
                                case 0:
                                  fieldName = _ref3.fieldName, value = _ref3.value;
                                  _context.t0 = queryExecutor;
                                  _context.t1 = _utils.DISTINCT;
                                  _context.t2 = collection;
                                  _context.next = 6;
                                  return (0, _utils.mapFiltersToSelector)(value, filterType._fields);

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
                                  fieldName = (0, _utils.getRelationFieldName)(collection, relationField, isMany);

                                  if (!isMany) {
                                    value = {
                                      $in: value
                                    };
                                  }

                                  return _context.abrupt("return", {
                                    fieldName: fieldName,
                                    value: value
                                  });

                                case 15:
                                case "end":
                                  return _context.stop();
                              }
                            }
                          }, _callee, this);
                        }));

                        return function (_x2) {
                          return _ref4.apply(this, arguments);
                        };
                      }());
                      return _context2.abrupt("return", Promise.all(res));

                    case 6:
                    case "end":
                      return _context2.stop();
                  }
                }
              }, _callee2, this);
            }));

            return function (_x) {
              return _ref2.apply(this, arguments);
            };
          }(); ////////////////////


          var valueField = (0, _utils.getRelationFieldName)(collection, relationField, isMany); ////add id field

          if (!externalField) {
            objectType._fields[valueField] = (0, _objectSpread4.default)({}, field, {
              name: valueField,
              isDeprecated: false,
              args: [],
              type: isMany ? new _graphql.GraphQLList((0, _utils.GraphQLTypeFromString)(fieldType)) : (0, _utils.GraphQLTypeFromString)(fieldType),
              resolve: field.resolve ? field.resolve : _graphql.defaultFieldResolver,
              skipCreate: field.skipCreate
            });
          } /////resolve


          var relField = relationField;

          if (externalField) {
            valueField = relationField;
            relField = externalField;
          }

          if (isMany) {
            var _filterType = (0, _utils.getInputType)("".concat(collection, "Filter"), SchemaTypes);

            var orderByType = (0, _utils.getInputType)("".concat(collection, "OrderBy"), SchemaTypes);
            field.args = (0, _utils.allQueryArgs)({
              filterType: _filterType,
              orderByType: orderByType
            });
            field.resolve = (0, _utils.combineResolvers)(field.resolve, function (parent, args, context, info) {
              var value = parent[valueField];

              if (_lodash.default.isArray(value)) {
                value = {
                  $in: value
                };
              }

              var selector = (0, _objectSpread4.default)({}, (0, _utils.mapFiltersToSelector)(args.filter, _filterType._fields), (0, _defineProperty2.default)({}, relField, value));
              return queryExecutor({
                type: _utils.FIND,
                collection: collection,
                selector: selector,
                options: {
                  skip: args.skip,
                  limit: args.first
                },
                context: context
              });
            }); ///////////Meta field

            var metaName = "_".concat(field.name, "Meta");
            objectType._fields[metaName] = {
              name: metaName,
              skipFilter: true,
              skipCreate: true,
              isDeprecated: false,
              args: (0, _utils.allQueryArgs)({
                filterType: _filterType,
                orderByType: orderByType
              }),
              type: SchemaTypes._QueryMeta,
              resolve: function resolve(parent, args, context, info) {
                var value = parent[valueField];

                if (_lodash.default.isArray(value)) {
                  value = {
                    $in: value
                  };
                }

                var selector = (0, _objectSpread4.default)({}, (0, _utils.mapFiltersToSelector)(args.filter, _filterType._fields), (0, _defineProperty2.default)({}, relField, value));
                return {
                  count: queryExecutor({
                    type: _utils.COUNT,
                    collection: collection,
                    selector: selector,
                    options: {
                      skip: args.skip,
                      limit: args.first
                    },
                    context: context
                  })
                };
              }
            }; // console.log(objectType._fields);
            ////
          } else {
            field.resolve = (0, _utils.combineResolvers)(field.resolve, function (parent, args, context, info) {
              var value = parent[valueField];
              var selector = (0, _defineProperty2.default)({}, relationField, value);
              return queryExecutor({
                type: _utils.FIND_ONE,
                collection: collection,
                selector: (0, _defineProperty2.default)({}, relationField, value),
                options: {
                  skip: args.skip,
                  limit: args.first
                },
                context: context
              });
            });
          }

          field.skipCreate = true;
        } // const { resolveMapFilterToSelector } = field;
        // field.resolveMapFilterToSelector = function(params) {
        //   console.log(params);
        //   if (resolveMapFilterToSelector) {
        //     params = resolveMapFilterToSelector.apply(this, params);
        //   }
        //   // console.log({ fieldName, value });
        //   return params.map(({ fieldName, value }) => ({ fieldName: name, value }));
        // };
        // const { resolve = defaultFieldResolver } = field;
        // field.resolve = async function(parent, args, context, info) {
        //   return parent[name];
        // };

      }]);
      return RelationDirective;
    }(_graphqlTools.SchemaDirectiveVisitor)
  );
};

exports.default = _default;