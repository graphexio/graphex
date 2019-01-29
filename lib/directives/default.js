"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.DefaultDirectiveScheme = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf3 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _lodash = _interopRequireDefault(require("lodash"));

var _graphqlTools = require("graphql-tools");

var _utils = require("../inputTypes/utils");

var _handlers = require("../inputTypes/handlers");

var _kinds = require("../inputTypes/kinds");

var DefaultDirectiveScheme = "directive @default(value: String!) on FIELD_DEFINITION";
exports.DefaultDirectiveScheme = DefaultDirectiveScheme;

var DefaultDirective =
/*#__PURE__*/
function (_SchemaDirectiveVisit) {
  (0, _inherits2.default)(DefaultDirective, _SchemaDirectiveVisit);

  function DefaultDirective() {
    var _getPrototypeOf2;

    var _this;

    (0, _classCallCheck2.default)(this, DefaultDirective);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = (0, _possibleConstructorReturn2.default)(this, (_getPrototypeOf2 = (0, _getPrototypeOf3.default)(DefaultDirective)).call.apply(_getPrototypeOf2, [this].concat(args)));
    (0, _defineProperty2.default)((0, _assertThisInitialized2.default)((0, _assertThisInitialized2.default)(_this)), "_setDefaultValue", function (fieldName, defaultValue) {
      return function (params) {
        var value = params[fieldName];

        if (value === undefined || value === null) {
          value = defaultValue;
        }

        params[fieldName] = value;
        return params;
      };
    });
    return _this;
  }

  (0, _createClass2.default)(DefaultDirective, [{
    key: "visitFieldDefinition",
    value: function visitFieldDefinition(field) {
      var value = this.args.value;
      value = JSON.parse(value);
      field.mmTransformAlways = [_kinds.CREATE_ALWAYS];
      (0, _utils.appendTransform)(field, _handlers.TRANSFORM_INPUT, (0, _defineProperty2.default)({}, _kinds.CREATE_ALWAYS, this._setDefaultValue(field.name, value)));
    }
  }]);
  return DefaultDirective;
}(_graphqlTools.SchemaDirectiveVisitor);

exports.default = DefaultDirective;