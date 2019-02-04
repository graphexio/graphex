"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DateSchema = exports.DateScalar = void 0;

var _graphql = require("graphql");

var _graphqlTag = _interopRequireDefault(require("graphql-tag"));

const DateScalar = new _graphql.GraphQLScalarType({
  name: 'Date',
  description: 'Date type',
  serialize: val => val instanceof Date ? val.toISOString() : val,
  parseValue: val => new Date(val),
  parseLiteral: ast => ast.kind === _graphql.Kind.STRING ? new Date(ast.value) : ast.value
});
exports.DateScalar = DateScalar;
const DateSchema = _graphqlTag.default`
  scalar Date
`;
exports.DateSchema = DateSchema;