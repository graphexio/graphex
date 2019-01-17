"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.InheritScheme = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _graphql = require("graphql");

var _graphqlTools = require("graphql-tools");

var _lodash = _interopRequireDefault(require("lodash"));

var _utils = require("../utils");

var InheritScheme = "directive @inherit on INTERFACE";
exports.InheritScheme = InheritScheme;

var Inherit =
/*#__PURE__*/
function (_SchemaDirectiveVisit) {
  (0, _inherits2.default)(Inherit, _SchemaDirectiveVisit);

  function Inherit() {
    (0, _classCallCheck2.default)(this, Inherit);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(Inherit).apply(this, arguments));
  }

  (0, _createClass2.default)(Inherit, [{
    key: "visitInterface",
    value: function visitInterface(iface) {
      var SchemaTypes = this.schema._typeMap;

      if (!iface.mmDiscriminatorField) {
        iface.mmDiscriminatorField = '_type';
      }

      _lodash.default.values(SchemaTypes).filter(function (type) {
        return type._interfaces && type._interfaces.includes(iface);
      }).forEach(function (type) {
        type._fields = (0, _objectSpread2.default)({}, iface._fields, type._fields);

        if (!type.mmDiscriminator) {
          type.mmDiscriminator = (0, _utils.lowercaseFirstLetter)(type.name);
        }
      });

      iface.mmDiscriminatorMap = {};

      iface.mmOnSchemaInit = function () {
        _lodash.default.values(SchemaTypes).filter(function (type) {
          return _lodash.default.isArray(type._interfaces) && type._interfaces.includes(iface);
        }).forEach(function (type) {
          type.mmDiscriminatorField = iface.mmDiscriminatorField;
          iface.mmDiscriminatorMap[type.mmDiscriminator] = type.name;
        });
      };

      iface.resolveType = function (doc) {
        return iface.mmDiscriminatorMap[doc[iface.mmDiscriminatorField]];
      };
    }
  }]);
  return Inherit;
}(_graphqlTools.SchemaDirectiveVisitor);

exports.default = Inherit;