"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.ModelScheme = void 0;

var _graphql = require("graphql");

var _graphqlTools = require("graphql-tools");

var _lodash = _interopRequireDefault(require("lodash"));

var _pluralize = _interopRequireDefault(require("pluralize"));

var _utils = require("../utils");

const ModelScheme = `directive @model(collection:String=null) on OBJECT | INTERFACE`;
exports.ModelScheme = ModelScheme;

class Model extends _graphqlTools.SchemaDirectiveVisitor {
  visitObject(object) {
    const {
      collection
    } = this.args;
    object.mmCollectionName = collection || (0, _utils.lowercaseFirstLetter)((0, _pluralize.default)(object.name));
  }

  visitInterface(iface) {
    const {
      collection
    } = this.args;
    iface.mmCollectionName = collection || (0, _utils.lowercaseFirstLetter)((0, _pluralize.default)(iface.name));
    const {
      _typeMap: SchemaTypes
    } = this.schema;

    _lodash.default.values(SchemaTypes).filter(type => type._interfaces && type._interfaces.includes(iface)).forEach(type => {
      if ((0, _utils.getDirective)(type, 'model')) {
        throw `Do not use Model directive both on interface and implementation`;
      }

      type.mmCollectionName = iface.mmCollectionName;
    });
  }

}

exports.default = Model;