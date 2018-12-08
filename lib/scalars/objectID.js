"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.typeDef = exports.default = void 0;

var _taggedTemplateLiteral2 = _interopRequireDefault(require("@babel/runtime/helpers/taggedTemplateLiteral"));

var _graphql = require("graphql");

var _graphqlTag = _interopRequireDefault(require("graphql-tag"));

var _mongodb = require("mongodb");

function _templateObject() {
  var data = (0, _taggedTemplateLiteral2.default)(["\n  scalar ObjectID\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

var _default = new _graphql.GraphQLScalarType({
  name: 'ObjectID',
  description: 'MongoDB ObjectID type',
  serialize: function serialize(val) {
    return val.toString();
  },
  parseValue: function parseValue(val) {
    return (0, _mongodb.ObjectID)(val);
  },
  parseLiteral: function parseLiteral(ast) {
    return (0, _mongodb.ObjectID)(ast.value);
  }
});

exports.default = _default;
var typeDef = (0, _graphqlTag.default)(_templateObject());
exports.typeDef = typeDef;