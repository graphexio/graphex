"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.UniqueScheme = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _graphql = require("graphql");

var _graphqlTools = require("graphql-tools");

var UniqueScheme = "directive @unique on FIELD_DEFINITION";
exports.UniqueScheme = UniqueScheme;

var Unique =
/*#__PURE__*/
function (_SchemaDirectiveVisit) {
  (0, _inherits2.default)(Unique, _SchemaDirectiveVisit);

  function Unique() {
    (0, _classCallCheck2.default)(this, Unique);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(Unique).apply(this, arguments));
  }

  (0, _createClass2.default)(Unique, [{
    key: "visitFieldDefinition",
    value: function visitFieldDefinition(field) {
      field.unique = true;
    }
  }]);
  return Unique;
}(_graphqlTools.SchemaDirectiveVisitor);

exports.default = Unique;