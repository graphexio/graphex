"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.schemaDirectives = exports.typeDef = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _utils = require("../../inputTypes/utils");

var _handlers = require("../../inputTypes/handlers");

var _kinds = require("../../inputTypes/kinds");

var _transforms = require("../../inputTypes/transforms");

var _timestamps = require("./timestamps");

var typeDef = "directive @updatedAt on FIELD_DEFINITION";
exports.typeDef = typeDef;

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
      var _this = this,
          _appendTransform;

      (0, _utils.appendTransform)(field, _handlers.TRANSFORM_TO_INPUT, (_appendTransform = {}, (0, _defineProperty2.default)(_appendTransform, _kinds.CREATE, function (_ref) {
        var field = _ref.field;
        return [{
          name: field.name,
          type: field.type,
          mmTransformAlways: (0, _utils.reduceTransforms)([(0, _transforms.fieldInputTransform)(field, _kinds.CREATE), _this._setDateCreate(field.name)])
        }];
      }), (0, _defineProperty2.default)(_appendTransform, _kinds.UPDATE, function (_ref2) {
        var field = _ref2.field;
        return [{
          name: field.name,
          type: field.type,
          mmTransformAlways: (0, _utils.reduceTransforms)([(0, _transforms.fieldInputTransform)(field, _kinds.UPDATE), _this._setDateUpdate(field.name)])
        }];
      }), _appendTransform));
    }
  }]);
  return UpdatedAt;
}(_timestamps.TimestampDirective);

var schemaDirectives = {
  updatedAt: UpdatedAt
};
exports.schemaDirectives = schemaDirectives;