"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CreatedAtResolver = exports.default = exports.CreatedAtScheme = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _utils = require("../inputTypes/utils");

var _handlers = require("../inputTypes/handlers");

var _kinds = require("../inputTypes/kinds");

var _timestamps = require("./timestamps");

var CreatedAtScheme = "directive @createdAt on FIELD_DEFINITION";
exports.CreatedAtScheme = CreatedAtScheme;

var CreatedAt =
/*#__PURE__*/
function (_TimestampDirective) {
  (0, _inherits2.default)(CreatedAt, _TimestampDirective);

  function CreatedAt() {
    (0, _classCallCheck2.default)(this, CreatedAt);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(CreatedAt).apply(this, arguments));
  }

  (0, _createClass2.default)(CreatedAt, [{
    key: "visitFieldDefinition",
    value: function visitFieldDefinition(field) {
      field.mmTransformAlways = [_kinds.CREATE_ALWAYS];
      (0, _utils.appendTransform)(field, _handlers.TRANSFORM_INPUT, (0, _defineProperty2.default)({}, _kinds.CREATE_ALWAYS, this._setDateCreate(field.name)));
    }
  }]);
  return CreatedAt;
}(_timestamps.TimestampDirective);

exports.default = CreatedAt;
var CreatedAtResolver = _timestamps.TimestampResolver;
exports.CreatedAtResolver = CreatedAtResolver;