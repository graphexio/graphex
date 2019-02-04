"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.AbstractScheme = void 0;

var _graphqlTools = require("graphql-tools");

const AbstractScheme = `directive @abstract on INTERFACE`;
exports.AbstractScheme = AbstractScheme;

class Inherit extends _graphqlTools.SchemaDirectiveVisitor {
  visitInterface(iface) {
    const {
      _typeMap: SchemaTypes
    } = this.schema;
    iface.mmAbstract = true;
    iface.mmAbstractTypes = [];
    Object.values(SchemaTypes).filter(type => type._interfaces && type._interfaces.includes(iface)).forEach(type => {
      iface.mmAbstractTypes.push(type);
      type._fields = { ...iface._fields,
        ...type._fields
      };
    });
  }

}

exports.default = Inherit;