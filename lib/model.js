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

var ModelScheme = "directive @model(primaryKey:String=\"id\") on OBJECT";
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
      var primaryKey = this.args.primaryKey;
      object._fields[primaryKey].primaryKey = true;
      ['createdAt', 'updatedAt'].forEach(function (field) {
        object._fields[field] = {
          name: field,
          type: _graphql.GraphQLInt,
          args: [],
          isDeprecated: false,
          resolve: _graphql.defaultFieldResolver,
          skipCreate: true
        };
      });
    }
  }, {
    key: "exitObject",
    value: function exitObject(object) {// console.log('exit', object);
    }
  }]);
  return Model;
}(_graphqlTools.SchemaDirectiveVisitor);

exports.default = Model;