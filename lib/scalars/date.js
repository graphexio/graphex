"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DateSchema = exports.DateScalar = void 0;

var _taggedTemplateLiteral2 = _interopRequireDefault(require("@babel/runtime/helpers/taggedTemplateLiteral"));

var _graphql = require("graphql");

var _graphqlTag = _interopRequireDefault(require("graphql-tag"));

function _templateObject() {
  var data = (0, _taggedTemplateLiteral2.default)(["\n  scalar Date\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

var DateScalar = new _graphql.GraphQLScalarType({
  name: 'Date',
  description: 'Date type',
  serialize: function serialize(val) {
    return val instanceof Date ? val.toISOString() : val;
  },
  parseValue: function parseValue(val) {
    return new Date(val);
  },
  parseLiteral: function parseLiteral(ast) {
    return new Date(ast.value);
  }
});
exports.DateScalar = DateScalar;
var DateSchema = (0, _graphqlTag.default)(_templateObject());
exports.DateSchema = DateSchema;