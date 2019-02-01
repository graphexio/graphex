"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.schemaDirectives = exports.typeDef = void 0;

var _graphqlTag = _interopRequireDefault(require("graphql-tag"));

var _graphqlTools = require("graphql-tools");

var _inputTypes = _interopRequireDefault(require("../../inputTypes"));

const typeDef = _graphqlTag.default`
  directive @initInputTypes on OBJECT
`;
exports.typeDef = typeDef;

class InitInputTypes extends _graphqlTools.SchemaDirectiveVisitor {
  visitObject(object) {
    const {
      _typeMap: SchemaTypes
    } = this.schema;

    _inputTypes.default.setSchemaTypes(SchemaTypes);
  }

}

const schemaDirectives = {
  initInputTypes: InitInputTypes
};
exports.schemaDirectives = schemaDirectives;