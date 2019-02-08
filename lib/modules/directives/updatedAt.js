"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.schemaDirectives = exports.typeDef = void 0;

var _utils = require("../../inputTypes/utils");

var _handlers = require("../../inputTypes/handlers");

var _kinds = require("../../inputTypes/kinds");

var _transforms = require("../../inputTypes/transforms");

var _timestamps = require("./timestamps");

const typeDef = `directive @updatedAt on FIELD_DEFINITION`;
exports.typeDef = typeDef;

class UpdatedAt extends _timestamps.TimestampDirective {
  visitFieldDefinition(field) {
    (0, _utils.appendTransform)(field, _handlers.TRANSFORM_TO_INPUT, {
      [_kinds.CREATE]: ({
        field
      }) => [{
        name: field.name,
        type: field.type,
        mmTransformAlways: (0, _utils.reduceTransforms)([this._setDate(field.name), (0, _transforms.fieldInputTransform)(field, _kinds.CREATE)])
      }],
      [_kinds.UPDATE]: ({
        field
      }) => [{
        name: field.name,
        type: field.type,
        mmTransformAlways: (0, _utils.reduceTransforms)([this._setDate(field.name), (0, _transforms.fieldInputTransform)(field, _kinds.UPDATE)])
      }]
    });
  }

}

const schemaDirectives = {
  updatedAt: UpdatedAt
};
exports.schemaDirectives = schemaDirectives;