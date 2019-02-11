"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DirectiveDBResolver = DirectiveDBResolver;
exports.default = exports.DirectiveDBScheme = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _lodash = _interopRequireDefault(require("lodash"));

var _graphqlTools = require("graphql-tools");

var _utils = require("../inputTypes/utils");

var HANDLER = _interopRequireWildcard(require("../inputTypes/handlers"));

var KIND = _interopRequireWildcard(require("../inputTypes/kinds"));

var _utils2 = require("../utils");

const DirectiveDBScheme = `directive @db(name:String!, defaultValue:String=null) on FIELD_DEFINITION`;
exports.DirectiveDBScheme = DirectiveDBScheme;

class DirectiveDB extends _graphqlTools.SchemaDirectiveVisitor {
  constructor(...args) {
    super(...args);
    (0, _defineProperty2.default)(this, "_renameTransform", (fieldName, dbName) => params => {
      let value = params[fieldName];
      return { ..._lodash.default.omit(params, fieldName),
        [dbName]: value
      };
    });
  }

  visitFieldDefinition(field) {
    const {
      name
    } = this.args;
    (0, _utils.appendTransform)(field, HANDLER.TRANSFORM_INPUT, {
      [KIND.CREATE]: this._renameTransform(field.name, name),
      [KIND.UPDATE]: this._renameTransform(field.name, name),
      [KIND.WHERE]: this._renameTransform(field.name, name)
    });
    (0, _utils.appendTransform)(field, HANDLER.TRANSFORM_TO_INPUT, {
      [KIND.ORDER_BY]: ({
        field
      }) => [{
        name: `${field.name}_ASC`,
        value: {
          [name]: 1
        }
      }, {
        name: `${field.name}_DESC`,
        value: {
          [name]: -1
        }
      }]
    });
  }

}

exports.default = DirectiveDB;

function DirectiveDBResolver(next, source, args, ctx, info) {
  const {
    name
  } = args;
  info.fieldName = name;
  return next();
}