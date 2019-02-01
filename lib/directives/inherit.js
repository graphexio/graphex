"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.InheritScheme = void 0;

var _graphql = require("graphql");

var _graphqlTools = require("graphql-tools");

var _lodash = _interopRequireDefault(require("lodash"));

var _utils = require("../utils");

const InheritScheme = `directive @inherit on INTERFACE`;
exports.InheritScheme = InheritScheme;

class Inherit extends _graphqlTools.SchemaDirectiveVisitor {
  visitInterface(iface) {
    const {
      _typeMap: SchemaTypes
    } = this.schema;

    if (!iface.mmDiscriminatorField) {
      iface.mmDiscriminatorField = '_type';
    }

    _lodash.default.values(SchemaTypes).filter(type => type._interfaces && type._interfaces.includes(iface)).forEach(type => {
      type._fields = { ...iface._fields,
        ...type._fields
      };

      if (!type.mmDiscriminator) {
        type.mmDiscriminator = (0, _utils.lowercaseFirstLetter)(type.name);
      }
    });

    iface.mmDiscriminatorMap = {};

    iface.mmOnSchemaInit = () => {
      _lodash.default.values(SchemaTypes).filter(type => _lodash.default.isArray(type._interfaces) && type._interfaces.includes(iface)).forEach(type => {
        type.mmDiscriminatorField = iface.mmDiscriminatorField;
        iface.mmDiscriminatorMap[type.mmDiscriminator] = type.name;
      });
    };

    iface.resolveType = doc => {
      return iface.mmDiscriminatorMap[doc[iface.mmDiscriminatorField]];
    };
  }

}

exports.default = Inherit;