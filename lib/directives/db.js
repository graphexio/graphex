"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DirectiveDBResolver = DirectiveDBResolver;
exports.default = exports.DirectiveDBScheme = void 0;

var _objectSpread3 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf3 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _lodash = _interopRequireDefault(require("lodash"));

var _graphql = require("graphql");

var _graphqlTools = require("graphql-tools");

var _utils = require("../inputTypes/utils");

var HANDLER = _interopRequireWildcard(require("../inputTypes/handlers"));

var KIND = _interopRequireWildcard(require("../inputTypes/kinds"));

var DirectiveDBScheme = "directive @db(name:String!) on FIELD_DEFINITION";
exports.DirectiveDBScheme = DirectiveDBScheme;

var DirectiveDB =
/*#__PURE__*/
function (_SchemaDirectiveVisit) {
  (0, _inherits2.default)(DirectiveDB, _SchemaDirectiveVisit);

  function DirectiveDB() {
    var _getPrototypeOf2;

    var _this;

    (0, _classCallCheck2.default)(this, DirectiveDB);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(DirectiveDB)).call.apply(_getPrototypeOf2, [this].concat(args)));
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_renameTransform", function (fieldName, dbName) {
      return function (params) {
        return (0, _objectSpread3.default)({}, _lodash.default.omit(params, fieldName), (0, _defineProperty2.default)({}, dbName, params[fieldName]));
      };
    });
    return _this;
  }

  (0, _createClass2.default)(DirectiveDB, [{
    key: "visitFieldDefinition",
    value: function visitFieldDefinition(field) {
      var _appendTransform;

      var name = this.args.name;
      (0, _utils.appendTransform)(field, HANDLER.TRANSFORM_INPUT, (_appendTransform = {}, (0, _defineProperty2.default)(_appendTransform, KIND.ORDER_BY, this._renameTransform(field.name, name)), (0, _defineProperty2.default)(_appendTransform, KIND.CREATE, this._renameTransform(field.name, name)), (0, _defineProperty2.default)(_appendTransform, KIND.WHERE, this._renameTransform(field.name, name)), _appendTransform));
    }
  }]);
  return DirectiveDB;
}(_graphqlTools.SchemaDirectiveVisitor);

exports.default = DirectiveDB;

function DirectiveDBResolver(next, source, args, ctx, info) {
  var name = args.name;
  info.fieldName = name;
  return next();
}