"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.IDScheme = void 0;

var _graphqlTools = require("graphql-tools");

var _utils = require("../inputTypes/utils");

var HANDLER = _interopRequireWildcard(require("../inputTypes/handlers"));

var KIND = _interopRequireWildcard(require("../inputTypes/kinds"));

const IDScheme = `directive @id on FIELD_DEFINITION`;
exports.IDScheme = IDScheme;

class ID extends _graphqlTools.SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    (0, _utils.appendTransform)(field, HANDLER.TRANSFORM_TO_INPUT, {
      [KIND.CREATE]: field => [],
      [KIND.UPDATE]: field => []
    });
  }

}

exports.default = ID;