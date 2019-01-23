"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TimestampsResolver = TimestampsResolver;
exports.default = exports.TimestampsScheme = void 0;

var _objectSpread3 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf3 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _lodash = _interopRequireDefault(require("lodash"));

var _graphql = require("graphql");

var _graphqlTools = require("graphql-tools");

var _scalars = require("../scalars");

var _utils = require("apollo-model-mongodb/lib/inputTypes/utils");

var HANDLER = _interopRequireWildcard(require("apollo-model-mongodb/lib/inputTypes/handlers"));

var KIND = _interopRequireWildcard(require("apollo-model-mongodb/lib/inputTypes/kinds"));

var _apolloModelMongodb = require("apollo-model-mongodb");

var TimestampsScheme = "directive @timestamps(createdAt:Boolean = true, updatedAt:Boolean = true createdAtName:String=null, updatedAtName:String=null) on OBJECT | INTERFACE";
exports.TimestampsScheme = TimestampsScheme;

var createField = function createField(_ref) {
  var type = _ref.type,
      _ref$args = _ref.args,
      args = _ref$args === void 0 ? [] : _ref$args,
      name = _ref.name,
      storeField = _ref.storeField;
  return {
    name: name,
    type: type,
    args: args,
    description: "",
    isDeprecated: false,
    resolve: function () {
      var _resolve = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/
      _regenerator.default.mark(function _callee(parent, args, context) {
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt("return", parent[storeField]);

              case 1:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function resolve(_x, _x2, _x3) {
        return _resolve.apply(this, arguments);
      };
    }()
  };
};

var Timestamps =
/*#__PURE__*/
function (_SchemaDirectiveVisit) {
  (0, _inherits2.default)(Timestamps, _SchemaDirectiveVisit);

  function Timestamps() {
    var _getPrototypeOf2;

    var _this;

    (0, _classCallCheck2.default)(this, Timestamps);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(Timestamps)).call.apply(_getPrototypeOf2, [this].concat(args)));
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_setDateTransform", function (fieldName) {
      return function (params) {
        params[fieldName] = new Date();
      };
    });
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_renameTransform", function (fieldName, dbName) {
      return function (params) {
        var value = params[fieldName];
        return (0, _objectSpread3.default)({}, _lodash.default.omit(params, fieldName), (0, _defineProperty2.default)({}, dbName, value));
      };
    });
    return _this;
  }

  (0, _createClass2.default)(Timestamps, [{
    key: "visitInterface",
    value: function visitInterface(iface) {
      var fields = this.setup(iface);
      var SchemaTypes = this.schema._typeMap;

      _lodash.default.values(SchemaTypes).filter(function (type) {
        return type._interfaces && type._interfaces.includes(iface);
      }).forEach(function (type) {
        if ((0, _apolloModelMongodb.getDirective)(type, 'model')) {
          type._fields = (0, _objectSpread3.default)({}, type._fields, fields);
        }
      });
    }
  }, {
    key: "visitObject",
    value: function visitObject(object) {
      var fields = this.setup(object);
      var SchemaTypes = this.schema._typeMap;

      _lodash.default.values(SchemaTypes).forEach(function (type) {
        if ((0, _apolloModelMongodb.getDirective)(type, 'model')) {
          type._fields = (0, _objectSpread3.default)({}, type._fields, fields);
        }
      });
    }
  }, {
    key: "setup",
    value: function setup(object) {
      var _fields;

      var _this$args = this.args,
          _this$args$createdAt = _this$args.createdAt,
          createdAt = _this$args$createdAt === void 0 ? true : _this$args$createdAt,
          _this$args$updatedAt = _this$args.updatedAt,
          updatedAt = _this$args$updatedAt === void 0 ? true : _this$args$updatedAt,
          _this$args$createdAtN = _this$args.createdAtName,
          createdAtName = _this$args$createdAtN === void 0 ? "createdAt" : _this$args$createdAtN,
          _this$args$updatedAtN = _this$args.updatedAtName,
          updatedAtName = _this$args$updatedAtN === void 0 ? "updatedAt" : _this$args$updatedAtN;
      var fields = object.getFields();

      if (createdAt) {
        if ('createdAt' in fields) {
          throw new Error("Conflicting field name createdAt");
        }

        fields['createdAt'] = createField({
          name: "createdAt",
          type: _scalars.Date,
          storeField: createdAtName
        });
        (0, _utils.appendTransform)(fields['createdAt'], HANDLER.TRANSFORM_INPUT, (0, _defineProperty2.default)({}, KIND.CREATE, this._setDateTransform('createdAt')));

        if (createdAtName !== 'createdAt') {
          var _appendTransform2;

          (0, _utils.appendTransform)(fields['createdAt'], HANDLER.TRANSFORM_INPUT, (_appendTransform2 = {}, (0, _defineProperty2.default)(_appendTransform2, KIND.ORDER_BY, this._renameTransform('createdAt', createdAtName)), (0, _defineProperty2.default)(_appendTransform2, KIND.CREATE, this._renameTransform('createdAt', createdAtName)), (0, _defineProperty2.default)(_appendTransform2, KIND.UPDATE, this._renameTransform('createdAt', createdAtName)), (0, _defineProperty2.default)(_appendTransform2, KIND.WHERE, this._renameTransform('createdAt', createdAtName)), _appendTransform2));
        }
      }

      if (updatedAt) {
        var _appendTransform3;

        fields['updatedAt'] = createField({
          name: "updatedAt",
          type: _scalars.Date,
          storeField: updatedAtName
        });
        (0, _utils.appendTransform)(fields['updatedAt'], HANDLER.TRANSFORM_INPUT, (_appendTransform3 = {}, (0, _defineProperty2.default)(_appendTransform3, KIND.CREATE, this._setDateTransform('updatedAt')), (0, _defineProperty2.default)(_appendTransform3, KIND.UPDATE, this._setDateTransform('updatedAt')), _appendTransform3));

        if (updatedAtName !== 'updatedAt') {
          var _appendTransform4;

          (0, _utils.appendTransform)(fields['updatedAt'], HANDLER.TRANSFORM_INPUT, (_appendTransform4 = {}, (0, _defineProperty2.default)(_appendTransform4, KIND.ORDER_BY, this._renameTransform('updatedAt', updatedAtName)), (0, _defineProperty2.default)(_appendTransform4, KIND.CREATE, this._renameTransform('updatedAt', updatedAtName)), (0, _defineProperty2.default)(_appendTransform4, KIND.UPDATE, this._renameTransform('updatedAt', updatedAtName)), (0, _defineProperty2.default)(_appendTransform4, KIND.WHERE, this._renameTransform('updatedAt', updatedAtName)), _appendTransform4));
        }
      }

      return _fields = fields, createdAt = _fields.createdAt, updatedAt = _fields.updatedAt, _fields;
    }
  }]);
  return Timestamps;
}(_graphqlTools.SchemaDirectiveVisitor);

exports.default = Timestamps;

function TimestampsResolver(next, source, args, ctx, info) {
  return next();
}