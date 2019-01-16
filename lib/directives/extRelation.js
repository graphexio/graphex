"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.ExtRelationScheme = void 0;

var _objectSpread3 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

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

var _lodash = _interopRequireDefault(require("lodash"));

var _utils = require("../utils");

var _queryExecutor = require("../queryExecutor");

var _inputTypes = _interopRequireDefault(require("../inputTypes"));

var _typeWrap = _interopRequireDefault(require("../typeWrap"));

var _utils2 = require("../inputTypes/utils");

var HANDLER = _interopRequireWildcard(require("../inputTypes/handlers"));

var KIND = _interopRequireWildcard(require("../inputTypes/kinds"));

var Transforms = _interopRequireWildcard(require("../inputTypes/transforms"));

var ExtRelationScheme = "directive @extRelation(field:String=\"_id\", fieldType:String=\"ObjectID\" ) on FIELD_DEFINITION";
exports.ExtRelationScheme = ExtRelationScheme;

var _default = function _default(queryExecutor) {
  var _temp;

  return _temp =
  /*#__PURE__*/
  function (_SchemaDirectiveVisit) {
    (0, _inherits2.default)(ExtRelationDirective, _SchemaDirectiveVisit);

    function ExtRelationDirective() {
      var _getPrototypeOf2;

      var _this;

      (0, _classCallCheck2.default)(this, ExtRelationDirective);

      for (var _len = arguments.length, _args = new Array(_len), _key = 0; _key < _len; _key++) {
        _args[_key] = arguments[_key];
      }

      _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(ExtRelationDirective)).call.apply(_getPrototypeOf2, [this].concat(_args)));
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_onSchemaInit", function (field) {
        var _assertThisInitialize = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)),
            lastType = _assertThisInitialize.mmLastType,
            isMany = _assertThisInitialize.mmIsMany;

        if (isMany) {
          var whereType = _inputTypes.default.get(lastType, 'where');

          var orderByType = _inputTypes.default.get(lastType, 'orderBy');

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
            var _ref = (0, _asyncToGenerator2.default)(
            /*#__PURE__*/
            _regenerator.default.mark(function _callee(parent, args, context, info) {
              var relationField, _assertThisInitialize2, lastType, isMany, storeField, value, selector;

              return _regenerator.default.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      relationField = _this.args.field;
                      _assertThisInitialize2 = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), lastType = _assertThisInitialize2.mmLastType, isMany = _assertThisInitialize2.mmIsMany, storeField = _assertThisInitialize2.mmStoreField;
                      value = parent[storeField];
                      selector = (0, _defineProperty2.default)({}, relationField, value);
                      return _context.abrupt("return", queryExecutor({
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
                      return _context.stop();
                  }
                }
              }, _callee, this);
            }));

            return function (_x, _x2, _x3, _x4) {
              return _ref.apply(this, arguments);
            };
          }()
        );
      });
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_resolveMany", function (field) {
        return (
          /*#__PURE__*/
          function () {
            var _ref2 = (0, _asyncToGenerator2.default)(
            /*#__PURE__*/
            _regenerator.default.mark(function _callee2(parent, args, context, info) {
              var relationField, _assertThisInitialize3, lastType, isMany, storeField, whereType, value, selector;

              return _regenerator.default.wrap(function _callee2$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      relationField = _this.args.field;
                      _assertThisInitialize3 = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), lastType = _assertThisInitialize3.mmLastType, isMany = _assertThisInitialize3.mmIsMany, storeField = _assertThisInitialize3.mmStoreField;
                      whereType = _inputTypes.default.get(lastType, 'where');
                      value = parent[relationField];

                      if (_lodash.default.isArray(value)) {
                        value = {
                          $in: value
                        };
                      }

                      _context2.t0 = _objectSpread3.default;
                      _context2.t1 = {};
                      _context2.next = 9;
                      return applyInputTransform(args.where, whereType);

                    case 9:
                      _context2.t2 = _context2.sent;
                      _context2.t3 = (0, _defineProperty2.default)({}, storeField, value);
                      selector = (0, _context2.t0)(_context2.t1, _context2.t2, _context2.t3);
                      return _context2.abrupt("return", queryExecutor({
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
                      return _context2.stop();
                  }
                }
              }, _callee2, this);
            }));

            return function (_x5, _x6, _x7, _x8) {
              return _ref2.apply(this, arguments);
            };
          }()
        );
      });
      (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_addConnectionField", function (field) {
        var _HANDLER$TRANSFORM_TO;

        var relationField = _this.args.field;

        var _assertThisInitialize4 = (0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)),
            lastType = _assertThisInitialize4.mmLastType,
            isMany = _assertThisInitialize4.mmIsMany,
            storeField = _assertThisInitialize4.mmStoreField;

        var SchemaTypes = _this.schema._typeMap;

        var whereType = _inputTypes.default.get(lastType, 'where');

        var orderByType = _inputTypes.default.get(lastType, 'orderBy');

        var connectionName = "".concat(field.name, "Connection");
        _this.mmObjectType._fields[connectionName] = (0, _defineProperty2.default)({
          name: connectionName,
          isDeprecated: false,
          args: (0, _utils.allQueryArgs)({
            whereType: whereType,
            orderByType: orderByType
          }),
          type: SchemaTypes["".concat(lastType.name, "Connection")],
          resolve: function () {
            var _resolve = (0, _asyncToGenerator2.default)(
            /*#__PURE__*/
            _regenerator.default.mark(function _callee3(parent, args, context, info) {
              var value, selector;
              return _regenerator.default.wrap(function _callee3$(_context3) {
                while (1) {
                  switch (_context3.prev = _context3.next) {
                    case 0:
                      value = parent[relationField];

                      if (_lodash.default.isArray(value)) {
                        value = {
                          $in: value
                        };
                      }

                      _context3.next = 4;
                      return applyInputTransform(args.where, whereType);

                    case 4:
                      _context3.t0 = _context3.sent;
                      _context3.t1 = (0, _defineProperty2.default)({}, storeField, value);
                      _context3.t2 = [_context3.t0, _context3.t1];
                      selector = {
                        $and: _context3.t2
                      };
                      return _context3.abrupt("return", {
                        _selector: selector,
                        _skip: args.skip,
                        _limit: args.first
                      });

                    case 9:
                    case "end":
                      return _context3.stop();
                  }
                }
              }, _callee3, this);
            }));

            function resolve(_x9, _x10, _x11, _x12) {
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
      return _this;
    }

    (0, _createClass2.default)(ExtRelationDirective, [{
      key: "visitFieldDefinition",
      value: function visitFieldDefinition(field, _ref4) {
        var _appendTransform;

        var objectType = _ref4.objectType;
        var SchemaTypes = this.schema._typeMap;
        var relationField = this.args.field;
        this.mmObjectType = objectType;
        var typeWrap = new _typeWrap.default(field.type);
        this.mmLastType = typeWrap.realType();
        this.mmIsMany = typeWrap.isMany();
        this.mmStoreField = (0, _utils.getRelationFieldName)(this.mmObjectType.name, relationField, false);
        (0, _utils2.appendTransform)(field, HANDLER.TRANSFORM_TO_INPUT, (_appendTransform = {}, (0, _defineProperty2.default)(_appendTransform, KIND.ORDER_BY, function (field) {
          return [];
        }), (0, _defineProperty2.default)(_appendTransform, KIND.CREATE, function (field) {
          return [];
        }), (0, _defineProperty2.default)(_appendTransform, KIND.UPDATE, function (field) {
          return [];
        }), (0, _defineProperty2.default)(_appendTransform, KIND.WHERE, function (field) {
          return [];
        }), _appendTransform));
        field.mmOnSchemaInit = this._onSchemaInit;
        field.resolve = this.mmIsMany ? this._resolveMany(field) : this._resolveSingle(field);
      }
    }]);
    return ExtRelationDirective;
  }(_graphqlTools.SchemaDirectiveVisitor), _temp;
};

exports.default = _default;