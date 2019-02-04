"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.AbstractScheme = void 0;

var _graphqlTools = require("graphql-tools");

const AbstractScheme = `directive @abstract(from:String = null) on INTERFACE`;
exports.AbstractScheme = AbstractScheme;

class Inherit extends _graphqlTools.SchemaDirectiveVisitor {
  visitInterface(iface) {
    const {
      _typeMap: SchemaTypes
    } = this.schema;
    iface.mmAbstract = true;
    iface.mmAbstractTypes = [];
    const {
      from = null
    } = this.args;

    if (from) {
      let fromAbstract = Object.values(SchemaTypes).find(type => type.name === from);

      if (!fromAbstract || !fromAbstract.mmAbstract) {
        throw `from:${from} was not found or does not contain the abstract directive`;
      }

      iface._fields = { ...fromAbstract._fields,
        ...iface._fields
      };
    }

    Object.values(SchemaTypes).filter(type => type._interfaces && type._interfaces.includes(iface)).forEach(type => {
      iface.mmAbstractTypes.push(type);
      type._fields = { ...iface._fields,
        ...type._fields
      };
    });
  }

}

exports.default = Inherit;