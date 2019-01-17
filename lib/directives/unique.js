"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.UniqueScheme = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _graphql = require("graphql");

var _graphqlTools = require("graphql-tools");

var _typeWrap = _interopRequireDefault(require("../typeWrap"));

var _utils = require("../inputTypes/utils");

var HANDLER = _interopRequireWildcard(require("../inputTypes/handlers"));

var KIND = _interopRequireWildcard(require("../inputTypes/kinds"));

var Transforms = _interopRequireWildcard(require("../inputTypes/transforms"));

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
      var SchemaTypes = this.schema._typeMap;
      var relationField = this.args.field;
      (0, _utils.appendTransform)(field, HANDLER.TRANSFORM_TO_INPUT, (0, _defineProperty2.default)({}, KIND.WHERE_UNIQUE, function (_ref) {
        var field = _ref.field;
        return [{
          name: field.name,
          type: new _typeWrap.default(field.type).realType(),
          mmTransform: (0, _utils.reduceTransforms)([Transforms.fieldInputTransform(field, KIND.WHERE), Transforms.transformModifier('')])
        }];
      }));
    }
  }]);
  return Unique;
}(_graphqlTools.SchemaDirectiveVisitor);

exports.default = Unique;