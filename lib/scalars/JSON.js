"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.JSONSchema = exports.JSONScalar = void 0;

var _graphql = require("graphql");

var _graphqlTag = _interopRequireDefault(require("graphql-tag"));

const JSONScalar = new _graphql.GraphQLScalarType({
  name: 'JSON',
  description: 'JSON Scalar. returns ',
  serialize: val => JSON.stringify(val),
  parseValue: val => JSON.parse(val),
  parseLiteral: ast => {
    try {
      return JSON.parse(ast.value);
    } catch (e) {
      return ast.value;
    }
  }
});
exports.JSONScalar = JSONScalar;
const JSONSchema = _graphqlTag.default`
  scalar JSON
`;
exports.JSONSchema = JSONSchema;