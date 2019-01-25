"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UpdatedAtResolver = exports.default = exports.UpdatedAtScheme = void 0;

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

var UpdatedAtScheme = "directive @updatedAt(name:String!) on FIELD_DEFINITION";
exports.UpdatedAtScheme = UpdatedAtScheme;

var UpdatedAt =
/*#__PURE__*/
function (_TimestampDirective) {
  (0, _inherits2.default)(UpdatedAt, _TimestampDirective);

  function UpdatedAt() {
    (0, _classCallCheck2.default)(this, UpdatedAt);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(UpdatedAt).apply(this, arguments));
  }

  (0, _createClass2.default)(UpdatedAt, [{
    key: "visitFieldDefinition",
    value: function visitFieldDefinition(field) {
      var _appendTransform;

      var name = this.args.name;
      (0, _utils.appendTransform)(field, _handlers.TRANSFORM_INPUT, (_appendTransform = {}, (0, _defineProperty2.default)(_appendTransform, _kinds.CREATE, this._setDate(field.name, name)), (0, _defineProperty2.default)(_appendTransform, _kinds.UPDATE, this._setDate(field.name, name)), _appendTransform));
    }
  }]);
  return UpdatedAt;
}(_timestamps.TimestampDirective);

exports.default = UpdatedAt;
var UpdatedAtResolver = _timestamps.TimestampResolver;
exports.UpdatedAtResolver = UpdatedAtResolver;