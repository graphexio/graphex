"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.schemaDirectives = exports.typeDef = void 0;

var _graphqlTag = _interopRequireDefault(require("graphql-tag"));

var _graphqlTools = require("graphql-tools");

const typeDef = _graphqlTag.default`
  directive @discriminator(value: String) on OBJECT | INTERFACE
`;
exports.typeDef = typeDef;

class Discriminator extends _graphqlTools.SchemaDirectiveVisitor {
  visitInterface(iface) {
    const {
      value
    } = this.args;
    iface.mmDiscriminatorField = value;
  }

  visitObject(object) {
    const {
      value
    } = this.args;
    object.mmDiscriminator = value;
  }

}

const schemaDirectives = {
  discriminator: Discriminator
};
exports.schemaDirectives = schemaDirectives;