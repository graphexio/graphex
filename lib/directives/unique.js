"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.UniqueScheme = void 0;

var _graphql = require("graphql");

var _graphqlTools = require("graphql-tools");

var _typeWrap = _interopRequireDefault(require("../typeWrap"));

var _utils = require("../inputTypes/utils");

var HANDLER = _interopRequireWildcard(require("../inputTypes/handlers"));

var KIND = _interopRequireWildcard(require("../inputTypes/kinds"));

var Transforms = _interopRequireWildcard(require("../inputTypes/transforms"));

const UniqueScheme = `directive @unique on FIELD_DEFINITION`;
exports.UniqueScheme = UniqueScheme;

class Unique extends _graphqlTools.SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const {
      _typeMap: SchemaTypes
    } = this.schema;
    const {
      field: relationField
    } = this.args;
    (0, _utils.appendTransform)(field, HANDLER.TRANSFORM_TO_INPUT, {
      [KIND.WHERE_UNIQUE]: ({
        field
      }) => [{
        name: field.name,
        type: new _typeWrap.default(field.type).realType(),
        mmDatabaseName: field.mmDatabaseName,
        mmTransform: (0, _utils.reduceTransforms)([Transforms.fieldInputTransform(field, KIND.WHERE)])
      }]
    });
  }

}

exports.default = Unique;