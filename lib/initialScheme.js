"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _graphqlTag = _interopRequireDefault(require("graphql-tag"));

var _default = _graphqlTag.default`
  type Query @initInputTypes
  type Mutation
  type Cursor {
    first: Int!
    skip: Int!
  }
`;

exports.default = _default;