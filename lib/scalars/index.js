"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.typeDefs = exports.default = void 0;

var _objectID = _interopRequireWildcard(require("./objectID"));

var _date = require("./date");

var _default = {
  ObjectID: _objectID.default,
  DateScalar: _date.DateScalar
};
exports.default = _default;
var typeDefs = [_objectID.typeDef, _date.DateSchema];
exports.typeDefs = typeDefs;