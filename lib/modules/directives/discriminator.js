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

function _templateObject() {
  var data = (0, _taggedTemplateLiteral2.default)(["\n  directive @discriminator(value: String) on OBJECT | INTERFACE\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

var typeDef = (0, _graphqlTag.default)(_templateObject());
exports.typeDef = typeDef;

var Discriminator =
/*#__PURE__*/
function (_SchemaDirectiveVisit) {
  (0, _inherits2.default)(Discriminator, _SchemaDirectiveVisit);

  function Discriminator() {
    (0, _classCallCheck2.default)(this, Discriminator);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(Discriminator).apply(this, arguments));
  }

  (0, _createClass2.default)(Discriminator, [{
    key: "visitInterface",
    value: function visitInterface(iface) {
      var value = this.args.value;
      iface.mmDiscriminatorField = value;
    }
  }, {
    key: "visitObject",
    value: function visitObject(object) {
      var value = this.args.value;
      object.mmDiscriminator = value;
    }
  }]);
  return Discriminator;
}(_graphqlTools.SchemaDirectiveVisitor);

var schemaDirectives = {
  discriminator: Discriminator
};
exports.schemaDirectives = schemaDirectives;