"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.ExtRelationScheme = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _ = _interopRequireWildcard(require("lodash"));

var _graphqlTools = require("graphql-tools");

var _utils = require("../utils");

var _utils2 = require("../inputTypes/utils");

var _queryExecutor = require("../queryExecutor");

var _inputTypes = _interopRequireDefault(require("../inputTypes"));

var _typeWrap = _interopRequireDefault(require("../typeWrap"));

var HANDLER = _interopRequireWildcard(require("../inputTypes/handlers"));

var KIND = _interopRequireWildcard(require("../inputTypes/kinds"));

var Transforms = _interopRequireWildcard(require("../inputTypes/transforms"));

var _relation = require("./relation");

const ExtRelationScheme = `directive @extRelation(field:String="_id", storeField:String=null, many:Boolean=false ) on FIELD_DEFINITION`;
exports.ExtRelationScheme = ExtRelationScheme;

var _default = queryExecutor => {
  var _temp;

  return _temp = class ExtRelationDirective extends _graphqlTools.SchemaDirectiveVisitor {
    constructor(..._args) {
      super(..._args);
      (0, _defineProperty2.default)(this, "_onSchemaInit", ({
        field
      }) => {
        let {
          mmFieldTypeWrap: fieldTypeWrap
        } = this;

        if (fieldTypeWrap.isMany()) {
          let whereType = _inputTypes.default.get(fieldTypeWrap.realType(), fieldTypeWrap.isInterface() ? KIND.WHERE_INTERFACE : KIND.WHERE);

          let orderByType = _inputTypes.default.get(fieldTypeWrap.realType(), KIND.ORDER_BY);

          field.args = (0, _utils.allQueryArgs)({
            whereType,
            orderByType
          });

          this._addConnectionField(field);
        }
      });
      (0, _defineProperty2.default)(this, "_onSchemaBuild", ({
        field
      }) => {
        let fieldTypeWrap = new _typeWrap.default(field.type); //Collection name and interface modifier

        if (fieldTypeWrap.isInherited()) {
          let {
            mmDiscriminator
          } = fieldTypeWrap.realType();
          let {
            mmDiscriminatorField
          } = fieldTypeWrap.interfaceType();
          this.mmCollectionName = fieldTypeWrap.realType().mmCollectionName;
          this.mmInterfaceModifier = {
            [mmDiscriminatorField]: mmDiscriminator
          };
        } else {
          this.mmInterfaceModifier = {};
          this.mmCollectionName = fieldTypeWrap.realType().mmCollectionName;
        }
      });
      (0, _defineProperty2.default)(this, "_transformToInputCreateUpdate", ({
        field,
        kind,
        inputTypes
      }) => {
        let fieldTypeWrap = new _typeWrap.default(field.type);
        let isCreate = kind === KIND.CREATE;
        let type = inputTypes.get(fieldTypeWrap.realType(), fieldTypeWrap.isMany() ? isCreate ? _relation.INPUT_CREATE_MANY_RELATION : fieldTypeWrap.isRequired() ? _relation.INPUT_UPDATE_MANY_REQUIRED_RELATION : _relation.INPUT_UPDATE_MANY_RELATION : isCreate ? _relation.INPUT_CREATE_ONE_RELATION : fieldTypeWrap.isRequired() ? _relation.INPUT_UPDATE_ONE_REQUIRED_RELATION : _relation.INPUT_UPDATE_ONE_RELATION);
        return [{
          name: field.name,
          type,
          mmTransform: (0, _utils2.reduceTransforms)([this._validateInput(type, fieldTypeWrap.isMany()), Transforms.applyNestedTransform(type), fieldTypeWrap.isMany() ? this._transformInputMany(isCreate) : this._transformInputOne(isCreate)])
        }];
      });
      (0, _defineProperty2.default)(this, "_transformInputOne", isCreate => async (params, resolverArgs) => {
        let {
          parent,
          context
        } = resolverArgs;
        let {
          mmStoreField: storeField,
          mmRelationField: relationField,
          mmCollectionName: collection
        } = this;

        let input = _.head(Object.values(params));

        if (input.connect) {
          ////Connect
          let selector = input.connect;

          if (this.isAbstract) {
            let {
              mmCollectionName: collection,
              ..._selector
            } = input.connect;
            selector = _selector;
          } // console.log(selector);


          let ids = await this._distinctQuery({
            selector,
            context
          });

          if (ids.length === 0) {
            throw new UserInputError(`No records found for selector - ${JSON.stringify(selector)}`);
          }

          return {
            [storeField]: {
              $mmConnectExtRelationship: {
                collection,
                selector,
                relationField
              }
            }
          };
        } else if (input.create) {
          ////Create
          let doc = input.create;

          if (this.isAbstract) {
            let {
              mmCollectionName: collection,
              ..._doc
            } = doc;
            doc = _doc;
          }

          return {
            [storeField]: {
              $mmCreateExtRelationship: {
                collection,
                doc,
                relationField
              }
            }
          };
        } else if (input.disconnect) {
          let selector = input.disconnect;

          if (this.isAbstract) {
            let {
              mmCollectionName: collection,
              _selector
            } = selector;
            selector = _selector;
          }

          return {
            [storeField]: {
              $mmDisconnectExtRelationship: {
                collection,
                selector,
                relationField
              }
            }
          };
        } else if (input.delete) {
          if (this.isAbstract) {
            let {
              mmCollectionName: collection
            } = input.delete;
          }

          return {
            [storeField]: {
              $mmDeleteExtRelationship: {
                collection,
                relationField
              }
            }
          };
        }
      });
      (0, _defineProperty2.default)(this, "_transformInputMany", isCreate => async (params, resolverArgs) => {
        let {
          mmStoreField: storeField
        } = this;
        let {
          parent,
          context
        } = resolverArgs;

        let input = _.head(Object.values(params));

        let ids = [];

        if (input.disconnect || input.delete) {
          if (input.disconnect) {
            ////Disconnect
            let selector = {
              $or: input.disconnect
            };
            ids = await this._distinctQuery({
              selector,
              context
            });

            if (ids.length === 0) {
              throw new UserInputError(`No records found for selector - ${JSON.stringify(selector)}`);
            }
          }

          if (input.delete) {
            let delete_ids = input.delete.map(selector => this._deleteOneQuery({
              selector,
              context
            }));
            delete_ids = await Promise.all(delete_ids);
            delete_ids = delete_ids.filter(id => id);
            ids = [...ids, ...delete_ids];
          }

          return {
            [storeField]: {
              $mmPullAll: ids
            }
          };
        } else {
          if (input.connect) {
            ////Connect
            let selector = {
              $or: input.connect
            };
            ids = await this._distinctQuery({
              selector,
              context
            }); // if (ids.length === 0) {
            //   throw new UserInputError(
            //     `No records found for selector - ${JSON.stringify(selector)}`
            //   );
            // }
          }

          if (input.create) {
            ////Create
            let docs = input.create;
            let create_ids = await this._insertManyQuery({
              docs,
              context
            });
            ids = [...ids, ...create_ids];
          }

          return {
            [storeField]: ids
          };
        }
      });
      (0, _defineProperty2.default)(this, "_resolveSingle", field => async (parent, args, context, info) => {
        const {
          field: relationField
        } = this.args;
        let {
          mmStoreField: storeField,
          mmInterfaceModifier,
          mmObjectType: modelType
        } = this;
        let value = parent[relationField];
        let selector = {
          [storeField]: value,
          ...mmInterfaceModifier
        };
        return queryExecutor({
          type: _queryExecutor.FIND_ONE,
          modelType,
          collection: this.mmCollectionName,
          selector,
          options: {},
          context
        });
      });
      (0, _defineProperty2.default)(this, "_resolveMany", field => async (parent, args, context, info) => {
        const {
          field: relationField
        } = this.args;
        let {
          mmFieldTypeWrap: fieldTypeWrap,
          mmStoreField: storeField,
          mmObjectType: modelType,
          mmInterfaceModifier
        } = this;

        let whereType = _inputTypes.default.get(fieldTypeWrap.realType(), fieldTypeWrap.isInterface() ? KIND.WHERE_INTERFACE : KIND.WHERE);

        let value = parent[relationField];

        if (Array.isArray(value)) {
          value = {
            $in: value
          };
        }

        let selector = await (0, _utils2.applyInputTransform)({
          parent,
          context
        })(args.where, whereType);

        if (fieldTypeWrap.isInterface()) {
          selector = Transforms.validateAndTransformInterfaceInput(whereType)({
            selector
          }).selector;
        }

        if (!_.isEmpty(mmInterfaceModifier)) {
          selector = { ...selector,
            ...mmInterfaceModifier
          };
        } else if (fieldTypeWrap.realType().mmInherit && _.isEmpty(selector)) {
          let ids = value || [];
          return queryExecutor({
            type: _queryExecutor.FIND_IDS,
            collection: this.mmCollectionName,
            modelType,
            selector,
            options: {
              ids,
              skip: args.skip,
              limit: args.first,
              selectorField: storeField
            },
            context
          });
        }

        selector[[storeField]] = value;
        return queryExecutor({
          type: _queryExecutor.FIND,
          collection: this.mmCollectionName,
          modelType,
          selector,
          options: {
            skip: args.skip,
            limit: args.first
          },
          context
        });
      });
      (0, _defineProperty2.default)(this, "_addConnectionField", field => {
        const {
          field: relationField
        } = this.args;
        let {
          mmFieldTypeWrap: fieldTypeWrap,
          mmStoreField: storeField
        } = this;
        const {
          _typeMap: SchemaTypes
        } = this.schema;

        let whereType = _inputTypes.default.get(fieldTypeWrap.realType(), KIND.WHERE);

        let orderByType = _inputTypes.default.get(fieldTypeWrap.realType(), KIND.ORDER_BY);

        let connectionName = `${field.name}Connection`;
        this.mmObjectType._fields[connectionName] = {
          name: connectionName,
          isDeprecated: false,
          args: (0, _utils.allQueryArgs)({
            whereType,
            orderByType
          }),
          type: SchemaTypes[`${fieldTypeWrap.realType().name}Connection`],
          resolve: async (parent, args, context, info) => {
            let value = parent[relationField];

            if (Array.isArray(value)) {
              value = {
                $in: value
              };
            }

            let selector = {
              $and: [await (0, _utils2.applyInputTransform)({
                parent,
                context
              })(args.where, whereType), {
                [storeField]: value
              }]
            };
            return {
              _selector: selector,
              _skip: args.skip,
              _limit: args.first
            };
          },
          [HANDLER.TRANSFORM_TO_INPUT]: {
            [KIND.CREATE]: () => [],
            [KIND.WHERE]: () => [],
            [KIND.UPDATE]: () => [],
            [KIND.ORDER_BY]: () => []
          }
        };
      });
    }

    visitFieldDefinition(field, {
      objectType
    }) {
      const {
        _typeMap: SchemaTypes
      } = this.schema;
      const {
        field: relationField,
        storeField,
        many
      } = this.args;
      let fieldTypeWrap = new _typeWrap.default(field.type);
      this.mmObjectType = objectType;
      this.mmFieldTypeWrap = fieldTypeWrap;
      this.mmRelationField = relationField;
      this.mmStoreField = storeField || (0, _utils.getRelationFieldName)(this.mmObjectType.name, relationField, many);
      (0, _utils2.appendTransform)(field, HANDLER.TRANSFORM_TO_INPUT, {
        [KIND.ORDER_BY]: field => [],
        [KIND.CREATE]: field => [],
        [KIND.UPDATE]: field => [],
        [KIND.WHERE]: field => []
      });
      field.mmOnSchemaInit = this._onSchemaInit;
      field.mmOnSchemaBuild = this._onSchemaBuild;
      field.resolve = fieldTypeWrap.isMany() ? this._resolveMany(field) : this._resolveSingle(field);
    }

  }, _temp;
};

exports.default = _default;