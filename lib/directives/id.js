"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.IDScheme = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _graphql = require("graphql");

var _graphqlTools = require("graphql-tools");

var _inputTypes = _interopRequireWildcard(require("../inputTypes"));

var _utils = require("../utils");

var IDScheme = "directive @id on FIELD_DEFINITION";
exports.IDScheme = IDScheme;

var ID =
/*#__PURE__*/
function (_SchemaDirectiveVisit) {
  (0, _inherits2.default)(ID, _SchemaDirectiveVisit);

  function ID() {
    (0, _classCallCheck2.default)(this, ID);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(ID).apply(this, arguments));
  }

  (0, _createClass2.default)(ID, [{
    key: "visitFieldDefinition",
    value: function visitFieldDefinition(field) {
      var _appendTransform;

      (0, _inputTypes.appendTransform)(field, _inputTypes.TRANSFORM_TO_INPUT, (_appendTransform = {}, (0, _defineProperty2.default)(_appendTransform, _inputTypes.INPUT_CREATE, function (field) {
        return [];
      }), (0, _defineProperty2.default)(_appendTransform, _inputTypes.INPUT_UPDATE, function (field) {
        return [];
      }), _appendTransform));
    }
  }]);
  return ID;
}(_graphqlTools.SchemaDirectiveVisitor);

exports.default = ID;