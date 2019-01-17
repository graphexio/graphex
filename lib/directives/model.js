"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.ModelScheme = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _graphql = require("graphql");

var _graphqlTools = require("graphql-tools");

var _lodash = _interopRequireDefault(require("lodash"));

var _pluralize = _interopRequireDefault(require("pluralize"));

var _utils = require("../utils");

var ModelScheme = "directive @model(collection:String=null) on OBJECT | INTERFACE";
exports.ModelScheme = ModelScheme;

var Model =
/*#__PURE__*/
function (_SchemaDirectiveVisit) {
  (0, _inherits2.default)(Model, _SchemaDirectiveVisit);

  function Model() {
    (0, _classCallCheck2.default)(this, Model);
    return (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(Model).apply(this, arguments));
  }

  (0, _createClass2.default)(Model, [{
    key: "visitObject",
    value: function visitObject(object) {
      var collection = this.args.collection;
      object.mmCollectionName = collection || (0, _utils.lowercaseFirstLetter)((0, _pluralize.default)(object.name));
    }
  }, {
    key: "visitInterface",
    value: function visitInterface(iface) {
      var collection = this.args.collection;
      iface.mmCollectionName = collection || (0, _utils.lowercaseFirstLetter)((0, _pluralize.default)(iface.name));
      var SchemaTypes = this.schema._typeMap;

      _lodash.default.values(SchemaTypes).filter(function (type) {
        return type._interfaces && type._interfaces.includes(iface);
      }).forEach(function (type) {
        if ((0, _utils.getDirective)(type, 'model')) {
          throw "Do not use Model directive both on interface and implementation";
        }

        type.mmCollectionName = iface.mmCollectionName;
      });
    }
  }]);
  return Model;
}(_graphqlTools.SchemaDirectiveVisitor);

exports.default = Model;