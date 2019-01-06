"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLastType = getLastType;
exports.getDirective = getDirective;
exports.getDirectiveArg = getDirectiveArg;
exports.getRelationFieldName = getRelationFieldName;
exports.hasQLListType = hasQLListType;
exports.hasQLNonNullType = hasQLNonNullType;
exports.cloneSchema = cloneSchema;
exports.cloneSchemaOptional = cloneSchemaOptional;
exports.asyncForEach = asyncForEach;
exports.allQueryArgs = allQueryArgs;
exports.GraphQLTypeFromString = GraphQLTypeFromString;
exports.combineResolvers = combineResolvers;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _graphql = require("graphql");

var _scalars = _interopRequireDefault(require("./scalars"));

var _graphqlResolvers = require("graphql-resolvers");

var _lodash = _interopRequireDefault(require("lodash"));

var _pluralize = _interopRequireDefault(require("pluralize"));

function getLastType(fieldType) {
  if (fieldType.ofType) {
    return getLastType(fieldType.ofType);
  }

  return fieldType;
}

function getDirective(field, name) {
  if (field.astNode && field.astNode.directives) {
    return _lodash.default.find(field.astNode.directives, function (directive) {
      return directive.name.value == name;
    });
  }

  return undefined;
}

function getDirectiveArg(directive, name, defaultValue) {
  var arg = _lodash.default.find(directive.arguments, function (argument) {
    return argument.name.value == name;
  });

  if (arg) return arg.value.value;else {
    return defaultValue;
  }
}

function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (letter, index) {
    return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
  }).replace(/\s+/g, '');
}

function getRelationFieldName(collection, field) {
  var many = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  field = field.replace('_', '');

  if (many) {
    field = (0, _pluralize.default)(field);
  }

  return camelize("".concat(collection, " ").concat(field));
}

function hasQLListType(fieldType) {
  if (fieldType instanceof _graphql.GraphQLList) {
    return true;
  }

  if (fieldType.ofType) {
    return hasQLListType(fieldType.ofType);
  }

  return false;
}

function hasQLNonNullType(fieldType) {
  if (fieldType instanceof _graphql.GraphQLNonNull) {
    return true;
  }

  if (fieldType.ofType) {
    return hasQLListType(fieldType.ofType);
  }

  return false;
}

function cloneSchema(schema, type) {
  if (schema instanceof _graphql.GraphQLNonNull) {
    return new _graphql.GraphQLNonNull(cloneSchema(schema.ofType, type));
  }

  if (schema instanceof _graphql.GraphQLList) {
    return new _graphql.GraphQLList(cloneSchema(schema.ofType, type));
  }

  return type;
}

function cloneSchemaOptional(schema, type) {
  if (schema instanceof _graphql.GraphQLNonNull) {
    return cloneSchema(schema.ofType, type);
  }

  if (schema instanceof _graphql.GraphQLList) {
    return new _graphql.GraphQLList(cloneSchema(schema.ofType, type));
  }

  return type;
}

function asyncForEach(_x, _x2) {
  return _asyncForEach.apply(this, arguments);
}

function _asyncForEach() {
  _asyncForEach = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(array, callback) {
    var index;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            index = 0;

          case 1:
            if (!(index < array.length)) {
              _context.next = 7;
              break;
            }

            _context.next = 4;
            return callback(array[index], index, array);

          case 4:
            index++;
            _context.next = 1;
            break;

          case 7:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _asyncForEach.apply(this, arguments);
}

function allQueryArgs(_ref) {
  var whereType = _ref.whereType,
      orderByType = _ref.orderByType;
  return [{
    name: 'where',
    description: null,
    type: whereType,
    defaultValue: undefined
  }, {
    name: 'orderBy',
    description: null,
    type: orderByType,
    defaultValue: undefined
  }, {
    name: 'skip',
    description: null,
    type: _graphql.GraphQLInt,
    defaultValue: undefined
  }, {
    name: 'first',
    description: null,
    type: _graphql.GraphQLInt,
    defaultValue: undefined
  }];
}

function GraphQLTypeFromString(type) {
  switch (type) {
    case 'ID':
      return _graphql.GraphQLID;

    case 'Int':
      return _graphql.GraphQLInt;

    case 'String':
      return _graphql.GraphQLString;

    case 'ObjectID':
      return _scalars.default.ObjectID;
  }
}

function combineResolvers() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  args = args.filter(function (arg) {
    return arg;
  });
  return _graphqlResolvers.combineResolvers.apply(void 0, (0, _toConsumableArray2.default)(args));
}