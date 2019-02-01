"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TimestampDirective = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _lodash = _interopRequireDefault(require("lodash"));

var _graphqlTools = require("graphql-tools");

class TimestampDirective extends _graphqlTools.SchemaDirectiveVisitor {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "_setDate", fieldName => params => {
      return {
        [fieldName]: new Date()
      };
    });
  }

}

exports.TimestampDirective = TimestampDirective;