"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.EmbeddedScheme = exports.INPUT_UPDATE_MANY_REQUIRED_EMBEDDED = exports.INPUT_UPDATE_ONE_REQUIRED_EMBEDDED = exports.INPUT_UPDATE_MANY_EMBEDDED = exports.INPUT_UPDATE_ONE_EMBEDDED = exports.INPUT_CREATE_MANY_EMBEDDED = exports.INPUT_CREATE_ONE_EMBEDDED = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _graphql = require("graphql");

var _graphqlTools = require("graphql-tools");

var _apolloServer = require("apollo-server");

var _ = _interopRequireWildcard(require("lodash"));

var _utils = require("../utils");

var _queryExecutor = require("../queryExecutor");

var _inputTypes = _interopRequireDefault(require("../inputTypes"));

var _typeWrap = _interopRequireDefault(require("../typeWrap"));

var _utils2 = require("../inputTypes/utils");

var HANDLER = _interopRequireWildcard(require("../inputTypes/handlers"));

var KIND = _interopRequireWildcard(require("../inputTypes/kinds"));

var Transforms = _interopRequireWildcard(require("../inputTypes/transforms"));

const INPUT_CREATE_ONE_EMBEDDED = 'createOneEmbedded';
exports.INPUT_CREATE_ONE_EMBEDDED = INPUT_CREATE_ONE_EMBEDDED;
const INPUT_CREATE_MANY_EMBEDDED = 'createManyEmbedded';
exports.INPUT_CREATE_MANY_EMBEDDED = INPUT_CREATE_MANY_EMBEDDED;
const INPUT_UPDATE_ONE_EMBEDDED = 'updateOneEmbedded';
exports.INPUT_UPDATE_ONE_EMBEDDED = INPUT_UPDATE_ONE_EMBEDDED;
const INPUT_UPDATE_MANY_EMBEDDED = 'updateManyEmbedded';
exports.INPUT_UPDATE_MANY_EMBEDDED = INPUT_UPDATE_MANY_EMBEDDED;
const INPUT_UPDATE_ONE_REQUIRED_EMBEDDED = 'updateOneRequiredEmbedded';
exports.INPUT_UPDATE_ONE_REQUIRED_EMBEDDED = INPUT_UPDATE_ONE_REQUIRED_EMBEDDED;
const INPUT_UPDATE_MANY_REQUIRED_EMBEDDED = 'updateManyRequiredEmbedded';
exports.INPUT_UPDATE_MANY_REQUIRED_EMBEDDED = INPUT_UPDATE_MANY_REQUIRED_EMBEDDED;
const EmbeddedScheme = `directive @embedded on OBJECT`;
exports.EmbeddedScheme = EmbeddedScheme;

var _default = queryExecutor => {
  var _temp;

  return _temp = class EmbeddedDirective extends _graphqlTools.SchemaDirectiveVisitor {
    constructor(...args) {
      super(...args);
      (0, _defineProperty2.default)(this, "_transformToInputWhere", ({
        field
      }) => {
        const {
          field: relationField
        } = this.args;
        let {
          mmFieldTypeWrap: fieldTypeWrap,
          mmCollectionName: collection,
          mmStoreField: storeField
        } = this;

        let inputType = _inputTypes.default.get(fieldTypeWrap.realType(), KIND.WHERE);

        let modifiers = fieldTypeWrap.isMany() ? ['some', 'none'] : [''];
        let fields = [];
        modifiers.forEach(modifier => {
          let fieldName = field.name;

          if (modifier !== '') {
            fieldName = `${field.name}_${modifier}`;
          }

          fields.push({
            name: fieldName,
            type: inputType,
            mmTransform: async (params, context) => {
              params = params[fieldName];
              let value = await queryExecutor({
                type: _queryExecutor.DISTINCT,
                collection,
                context,
                selector: await (0, _utils2.applyInputTransform)(context)(params, inputType),
                options: {
                  key: relationField
                }
              }); // if (!isMany) {

              value = {
                $in: value
              }; // }

              return {
                [storeField]: value
              };
            }
          });
        });
        return fields;
      });
      (0, _defineProperty2.default)(this, "_validateInput", (type, isMany) => params => {
        let input = _.head(Object.values(params));

        if (!isMany) {
          if (Object.keys(input) > 1) {
            throw new _apolloServer.UserInputError(`You should not fill multiple fields in ${type.name} type`);
          } else if (Object.keys(input) === 0) {
            throw new _apolloServer.UserInputError(`You should fill any field in ${type.name} type`);
          }
        } else {
          if ((input.disconnect || input.delete) && _.difference(Object.keys(input), ['delete', 'disconnect']).length > 0) {
            throw new _apolloServer.UserInputError(`Wrong input in ${type.name} type`);
          }
        }

        return params;
      });
      (0, _defineProperty2.default)(this, "_transformToInputCreateUpdate", ({
        field,
        kind,
        inputTypes
      }) => {
        let fieldTypeWrap = new _typeWrap.default(field.type);
        let isCreate = kind === KIND.CREATE;
        let type = inputTypes.get(fieldTypeWrap.realType(), fieldTypeWrap.isMany() ? isCreate ? INPUT_CREATE_MANY_EMBEDDED : fieldTypeWrap.isRequired() ? INPUT_UPDATE_MANY_REQUIRED_EMBEDDED : INPUT_UPDATE_MANY_EMBEDDED : isCreate ? INPUT_CREATE_ONE_EMBEDDED : fieldTypeWrap.isRequired() ? INPUT_UPDATE_ONE_REQUIRED_EMBEDDED : INPUT_UPDATE_ONE_EMBEDDED);
        return [{
          name: field.name,
          type,
          mmTransform: (0, _utils2.reduceTransforms)([this._validateInput(type, fieldTypeWrap.isMany()), Transforms.applyNestedTransform(type), fieldTypeWrap.isMany() ? this._transformInputMany : this._transformInputOne])
        }];
      });
      (0, _defineProperty2.default)(this, "_transformInputOne", field => async (params, resolverArgs) => {
        let input = _.head(Object.values(params));

        if (input.create || input.update) {
          return {
            [field.name]: input.create
          };
        } else if (input.delete) {
          return _.mapValues(params, val => ({
            $mmUnset: true
          }));
        }
      });
      (0, _defineProperty2.default)(this, "_transformInputMany", field => async (params, resolverArgs) => {
        let input = _.head(Object.values(params));

        if (input.delete) {
          return {
            [field.name]: {
              $mmPull: input.where
            }
          };
        } else {
          if (input.create || input.update) {
            ////Create
            let docs = input.create;
            return {
              [field.name]: {
                $mmPushAll: docs
              }
            };
          }
        }
      });
      (0, _defineProperty2.default)(this, "_onSchemaInit", ({
        field
      }) => {
        let fieldTypeWrap = new _typeWrap.default(field.type); ///Args and connection field

        if (fieldTypeWrap.isMany()) {
          let whereType = _inputTypes.default.get(fieldTypeWrap.realType(), fieldTypeWrap.isInterface() ? KIND.WHERE_INTERFACE : KIND.WHERE);

          let orderByType = _inputTypes.default.get(fieldTypeWrap.realType(), KIND.ORDER_BY);

          field.args = (0, _utils.allQueryArgs)({
            whereType
          });
        }
      });
      (0, _defineProperty2.default)(this, "_resolveSingle", field => async (parent, args, context, info) => {
        return parent[field.name];
      });
      (0, _defineProperty2.default)(this, "_resolveMany", field => async (parent, args, context, info) => {
        return parent[field.name];
      });
    }

    visitObject(object) {
      const {
        _typeMap: SchemaTypes
      } = this.schema;
      Object.values(SchemaTypes).filter(type => type.mmCollectionName).forEach(type => {
        type._fields.forEach(field => {
          let fieldTypeWrap = new _typeWrap.default(field.type);

          if (fieldTypeWrap.realType() === object) {
            this.visitFieldDefinition(field, {
              object
            });
          }
        });
      });
    }

    visitFieldDefinition(field, {
      objectType
    }) {
      let fieldTypeWrap = new _typeWrap.default(field.type);

      if (!(0, _utils.getDirective)(fieldTypeWrap.realType(), 'embedded') && !(fieldTypeWrap.isInherited() && (0, _utils.getDirective)(fieldTypeWrap.interfaceType(), 'embedded'))) {
        throw `Embedded field type should be defined with embedded directive. (Field '${field.name}' of type '${fieldTypeWrap.realType().name}')`;
      }

      (0, _utils2.appendTransform)(field, HANDLER.TRANSFORM_TO_INPUT, {
        [KIND.ORDER_BY]: () => [],
        [KIND.CREATE]: this._transformToInputCreateUpdate(field),
        [KIND.UPDATE]: this._transformToInputCreateUpdate(field),
        [KIND.WHERE]: this._transformToInputWhere(field)
      });
      field.mmOnSchemaInit = this._onSchemaInit;
      field.mmOnSchemaBuild = this._onSchemaBuild;
      field.resolve = fieldTypeWrap.isMany() ? this._resolveMany(field) : this._resolveSingle(field);
    }

  }, _temp;
};

exports.default = _default;

let createInputTransform = (type, isInterface) => (0, _utils2.reduceTransforms)([Transforms.applyNestedTransform(type), isInterface ? Transforms.validateAndTransformInterfaceInput(type) : null]);

const createInput = ({
  name,
  initialType,
  kind,
  inputTypes
}) => {
  let typeWrap = new _typeWrap.default(initialType);
  let createType = inputTypes.get(initialType, typeWrap.isInterface() ? KIND.CREATE_INTERFACE : KIND.CREATE);
  let updateType = inputTypes.get(initialType, typeWrap.isInterface() ? KIND.CREATE_INTERFACE : KIND.CREATE);
  let deleteType = inputTypes.get(initialType, typeWrap.isInterface() ? KIND.DELETE_INTERFACE : KIND.DELETE);
  let whereType = inputTypes.get(initialType, typeWrap.isInterface() ? KIND.WHERE_INTERFACE : KIND.WHERE);
  let whereField = {
    name: 'where',
    type: whereType,
    mmTransform: createInputTransform(whereType, typeWrap.isInterface())
  };
  let createField = {
    name: 'create',
    type: createType,
    mmTransform: createInputTransform(createType, typeWrap.isInterface())
  };
  let updateField = {
    name: 'update',
    type: updateType,
    mmTransform: createInputTransform(updateType, typeWrap.isInterface())
  };
  let deleteField = {
    name: 'delete',
    type: _graphql.GraphQLBoolean,
    mmTransform: createInputTransform(updateType, typeWrap.isInterface())
  };

  if ([INPUT_CREATE_MANY_EMBEDDED, INPUT_UPDATE_MANY_EMBEDDED, INPUT_UPDATE_MANY_REQUIRED_EMBEDDED].includes(kind)) {
    createType = new _graphql.GraphQLList(createType);
    updateType = new _graphql.GraphQLList(updateType);
    deleteType = new _graphql.GraphQLList(deleteType);
  }

  let fields = new Set();

  if ([INPUT_CREATE_ONE_EMBEDDED, INPUT_CREATE_MANY_EMBEDDED, INPUT_UPDATE_ONE_EMBEDDED, INPUT_UPDATE_MANY_EMBEDDED, INPUT_UPDATE_ONE_REQUIRED_EMBEDDED, INPUT_UPDATE_MANY_REQUIRED_EMBEDDED].includes(kind)) {
    fields.add(createField);
  }

  if ([INPUT_UPDATE_ONE_EMBEDDED, INPUT_UPDATE_MANY_EMBEDDED, INPUT_UPDATE_ONE_REQUIRED_EMBEDDED, INPUT_UPDATE_MANY_REQUIRED_EMBEDDED].includes(kind)) {
    fields.add(updateField);
    fields.add(deleteField);
  }

  if (INPUT_UPDATE_MANY_EMBEDDED) if ([INPUT_UPDATE_MANY_EMBEDDED, INPUT_UPDATE_MANY_REQUIRED_EMBEDDED].includes(kind)) {}
  let newType = new _graphql.GraphQLInputObjectType({
    name,
    fields
  });
  newType.getFields();
  return newType;
};

_inputTypes.default.registerKind(INPUT_CREATE_ONE_EMBEDDED, createInput);

_inputTypes.default.registerKind(INPUT_CREATE_MANY_EMBEDDED, createInput);

_inputTypes.default.registerKind(INPUT_UPDATE_ONE_EMBEDDED, createInput);

_inputTypes.default.registerKind(INPUT_UPDATE_MANY_EMBEDDED, createInput);

_inputTypes.default.registerKind(INPUT_UPDATE_ONE_REQUIRED_EMBEDDED, createInput);

_inputTypes.default.registerKind(INPUT_UPDATE_MANY_REQUIRED_EMBEDDED, createInput);