"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.schemaDirectives = exports.typeDef = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _taggedTemplateLiteral2 = _interopRequireDefault(require("@babel/runtime/helpers/taggedTemplateLiteral"));

var _graphqlTag = _interopRequireDefault(require("graphql-tag"));

var _graphqlTools = require("graphql-tools");

var _inputTypes = _interopRequireDefault(require("../../inputTypes"));

function _templateObject() {
  var data = (0, _taggedTemplateLiteral2.default)(["\n  directive @initInputTypes on OBJECT\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

var typeDef = (0, _graphqlTag.default)(_templateObject());
exports.typeDef = typeDef;

var InitInputTypes =
/*#__PURE__*/
function (_SchemaDirectiveVisit) {
  (0, _inherits2.default)(InitInputTypes, _SchemaDirectiveVisit);

  function InitInputTypes() {
    (0, _classCallCheck2.default)(this, InitInputTypes);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(InitInputTypes).apply(this, arguments));
  }

  (0, _createClass2.default)(InitInputTypes, [{
    key: "visitObject",
    value: function visitObject(object) {
      var SchemaTypes = this.schema._typeMap;

      _inputTypes.default.setSchemaTypes(SchemaTypes);
    }
  }]);
  return InitInputTypes;
}(_graphqlTools.SchemaDirectiveVisitor);

var schemaDirectives = {
  initInputTypes: InitInputTypes
};
exports.schemaDirectives = schemaDirectives;