"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.schemaDirectives = exports.typeDef = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf3 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _graphqlTools = require("graphql-tools");

var _utils = require("../../inputTypes/utils");

var _transforms = require("../../inputTypes/transforms");

var _handlers = require("../../inputTypes/handlers");

var _kinds = require("../../inputTypes/kinds");

var typeDef = "directive @default(value: String!) on FIELD_DEFINITION";
exports.typeDef = typeDef;

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
          params[fieldName] = defaultValue;
        }

        return params;
      };
    });
    return _this;
  }

  (0, _createClass2.default)(DefaultDirective, [{
    key: "visitFieldDefinition",
    value: function visitFieldDefinition(field) {
      var _this2 = this;

      var value = this.args.value;

      try {
        value = JSON.parse(value);
      } catch (e) {//skip parsing error
      }

      (0, _utils.appendTransform)(field, _handlers.TRANSFORM_TO_INPUT, (0, _defineProperty2.default)({}, _kinds.CREATE, function (_ref) {
        var field = _ref.field;
        return [{
          name: field.name,
          type: field.type,
          mmTransformAlways: (0, _utils.reduceTransforms)([_this2._setDefaultValue(field.name, value), (0, _transforms.fieldInputTransform)(field, _kinds.CREATE)])
        }];
      }));
    }
  }]);
  return DefaultDirective;
}(_graphqlTools.SchemaDirectiveVisitor);

var schemaDirectives = {
  default: DefaultDirective
};
exports.schemaDirectives = schemaDirectives;