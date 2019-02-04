"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.typeDef = exports.default = void 0;

var _graphql = require("graphql");

var _graphqlTag = _interopRequireDefault(require("graphql-tag"));

var _mongodb = require("mongodb");

var _default = new _graphql.GraphQLScalarType({
  name: 'ObjectID',
  description: 'MongoDB ObjectID type',
  serialize: val => val.toString(),
  parseValue: val => (0, _mongodb.ObjectID)(val),
  parseLiteral: ast => ast.kind === _graphql.Kind.STRING ? (0, _mongodb.ObjectID)(ast.value) : ast.value
});

exports.default = _default;
const typeDef = _graphqlTag.default`
  scalar ObjectID
`;
exports.typeDef = typeDef;