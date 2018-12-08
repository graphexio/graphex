"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.ReadOnlyScheme = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _graphql = require("graphql");

var _graphqlTools = require("graphql-tools");

var ReadOnlyScheme = "directive @readOnly on FIELD_DEFINITION";
exports.ReadOnlyScheme = ReadOnlyScheme;

var ReadOnly =
/*#__PURE__*/
function (_SchemaDirectiveVisit) {
  (0, _inherits2.default)(ReadOnly, _SchemaDirectiveVisit);

  function ReadOnly() {
    (0, _classCallCheck2.default)(this, ReadOnly);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(ReadOnly).apply(this, arguments));
  }

  (0, _createClass2.default)(ReadOnly, [{
    key: "visitFieldDefinition",
    value: function visitFieldDefinition(field) {
      field.skipCreate = true;
    }
  }]);
  return ReadOnly;
}(_graphqlTools.SchemaDirectiveVisitor);

exports.default = ReadOnly;