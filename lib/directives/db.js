"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DirectiveDBResolver = DirectiveDBResolver;
exports.default = exports.DirectiveDBScheme = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

var _graphqlTools = require("graphql-tools");

var _utils = require("../inputTypes/utils");

var HANDLER = _interopRequireWildcard(require("../inputTypes/handlers"));

var KIND = _interopRequireWildcard(require("../inputTypes/kinds"));

const DirectiveDBScheme = `directive @db(name:String!) on FIELD_DEFINITION`;
exports.DirectiveDBScheme = DirectiveDBScheme;

class DirectiveDB extends _graphqlTools.SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const {
      name
    } = this.args;
    field.mmDatabaseName = name;
    (0, _utils.appendTransform)(field, HANDLER.TRANSFORM_INPUT, {
      [KIND.CREATE]: params => params,
      [KIND.WHERE]: params => params
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

  if (Object.keys(source).includes(name)) {
    return source[name];
  }

  return next();
}