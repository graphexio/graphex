"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.RelationScheme = exports.INPUT_UPDATE_MANY_REQUIRED_RELATION = exports.INPUT_UPDATE_ONE_REQUIRED_RELATION = exports.INPUT_UPDATE_MANY_RELATION = exports.INPUT_UPDATE_ONE_RELATION = exports.INPUT_CREATE_MANY_RELATION = exports.INPUT_CREATE_ONE_RELATION = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _graphql = require("graphql");

var _graphqlTools = require("graphql-tools");

var _apolloServer = require("apollo-server");

var _lodash2 = _interopRequireDefault(require("lodash"));

var _utils = require("../utils");

var _queryExecutor = require("../queryExecutor");

var _inputTypes = _interopRequireDefault(require("../inputTypes"));

var _typeWrap = _interopRequireDefault(require("../typeWrap"));

var _utils2 = require("../inputTypes/utils");

var HANDLER = _interopRequireWildcard(require("../inputTypes/handlers"));

var KIND = _interopRequireWildcard(require("../inputTypes/kinds"));

var Transforms = _interopRequireWildcard(require("../inputTypes/transforms"));

const INPUT_CREATE_ONE_RELATION = 'createOneRelation';
exports.INPUT_CREATE_ONE_RELATION = INPUT_CREATE_ONE_RELATION;
const INPUT_CREATE_MANY_RELATION = 'createManyRelation';
exports.INPUT_CREATE_MANY_RELATION = INPUT_CREATE_MANY_RELATION;
const INPUT_UPDATE_ONE_RELATION = 'updateOneRelation';
exports.INPUT_UPDATE_ONE_RELATION = INPUT_UPDATE_ONE_RELATION;
const INPUT_UPDATE_MANY_RELATION = 'updateManyRelation';
exports.INPUT_UPDATE_MANY_RELATION = INPUT_UPDATE_MANY_RELATION;
const INPUT_UPDATE_ONE_REQUIRED_RELATION = 'updateOneRequiredRelation';
exports.INPUT_UPDATE_ONE_REQUIRED_RELATION = INPUT_UPDATE_ONE_REQUIRED_RELATION;
const INPUT_UPDATE_MANY_REQUIRED_RELATION = 'updateManyRequiredRelation';
exports.INPUT_UPDATE_MANY_REQUIRED_RELATION = INPUT_UPDATE_MANY_REQUIRED_RELATION;
const RelationScheme = `directive @relation(field:String="_id", storeField:String=null ) on FIELD_DEFINITION`;
exports.RelationScheme = RelationScheme;

var _default = queryExecutor => {
  var _temp;

  return _temp = class RelationDirective extends _graphqlTools.SchemaDirectiveVisitor {
    constructor(..._args) {
      super(..._args);
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
      (0, _defineProperty2.default)(this, "_transformToInputCreateUpdate", ({
        field,
        kind,
        inputTypes
      }) => {
        let fieldTypeWrap = new _typeWrap.default(field.type);
        let isCreate = kind === KIND.CREATE;
        let type = inputTypes.get(fieldTypeWrap.realType(), fieldTypeWrap.isMany() ? isCreate ? INPUT_CREATE_MANY_RELATION : fieldTypeWrap.isRequired() ? INPUT_UPDATE_MANY_REQUIRED_RELATION : INPUT_UPDATE_MANY_RELATION : isCreate ? INPUT_CREATE_ONE_RELATION : fieldTypeWrap.isRequired() ? INPUT_UPDATE_ONE_REQUIRED_RELATION : INPUT_UPDATE_ONE_RELATION);
        return [{
          name: field.name,
          type,
          mmTransform: (0, _utils2.reduceTransforms)([this._validateInput(type, fieldTypeWrap.isMany()), Transforms.applyNestedTransform(type), fieldTypeWrap.isMany() ? this._transformInputMany : this._transformInputOne])
        }];
      });
      (0, _defineProperty2.default)(this, "_validateInput", (type, isMany) => params => {
        let input = _lodash2.default.head(Object.values(params));

        if (!isMany) {
          if (Object.keys(input) > 1) {
            throw new _apolloServer.UserInputError(`You should not fill multiple fields in ${type.name} type`);
          } else if (Object.keys(input) === 0) {
            throw new _apolloServer.UserInputError(`You should fill any field in ${type.name} type`);
          }
        } else {
          if ((input.disconnect || input.delete) && _lodash2.default.difference(Object.keys(input), ['delete', 'disconnect']).length > 0) {
            throw new _apolloServer.UserInputError(`Wrong input in ${type.name} type`);
          }
        }

        return params;
      });
      (0, _defineProperty2.default)(this, "_transformInputOne", async (params, resolverArgs) => {
        let {
          parent,
          context
        } = resolverArgs;
        let {
          mmStoreField: storeField
        } = this;

        let input = _lodash2.default.head(Object.values(params));

        if (input.connect) {
          ////Connect
          let selector = input.connect; // console.log(selector);

          let ids = await this._distinctQuery({
            selector,
            context
          });

          if (ids.length === 0) {
            throw new _apolloServer.UserInputError(`No records found for selector - ${JSON.stringify(selector)}`);
          }

          return {
            [storeField]: _lodash2.default.head(ids)
          };
        } else if (input.create) {
          ////Create
          let doc = input.create;
          let id = await this._insertOneQuery({
            doc,
            context
          });
          return {
            [storeField]: id
          };
        } else if (input.disconnect) {
          ////Disconnect
          return {
            [storeField]: null
          };
        } else if (input.delete) {////Delete
        }
      });
      (0, _defineProperty2.default)(this, "_transformInputMany", async (params, resolverArgs) => {
        let {
          mmStoreField: storeField
        } = this;
        let {
          parent,
          context
        } = resolverArgs;

        let input = _lodash2.default.head(Object.values(params));

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
              throw new _apolloServer.UserInputError(`No records found for selector - ${JSON.stringify(selector)}`);
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
      (0, _defineProperty2.default)(this, "_onSchemaBuild", ({
        field
      }) => {
        let fieldTypeWrap = new _typeWrap.default(field.type);
        this.mmCollectionName = fieldTypeWrap.realType().mmCollectionName;
        this.mmInterfaceModifier = {}; //Collection name and interface modifier

        if (fieldTypeWrap.isInherited()) {
          let {
            mmDiscriminator
          } = fieldTypeWrap.realType();
          let {
            mmDiscriminatorField
          } = fieldTypeWrap.interfaceType();
          this.mmInterfaceModifier = {
            [mmDiscriminatorField]: mmDiscriminator
          };
        } else {
          this.isAbstract = fieldTypeWrap.isAbstract();
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
            whereType,
            orderByType
          });

          this._addConnectionField(field);
        }
      });
      (0, _defineProperty2.default)(this, "_resolveSingle", field => async (parent, args, context, info) => {
        const {
          field: relationField
        } = this.args;
        let {
          mmFieldTypeWrap: fieldTypeWrap,
          mmCollectionName: collection,
          mmStoreField: storeField,
          mmInterfaceModifier
        } = this;
        let selector = { ...mmInterfaceModifier
        };
        let value = parent[storeField];

        if (fieldTypeWrap.isAbstract()) {
          let {
            $id: value,
            $ref: collection
          } = value.toJSON();
        }

        if (!value) return null;
        return queryExecutor({
          type: _queryExecutor.FIND_IDS,
          collection,
          selector,
          options: {
            selectorField: relationField,
            ids: [value]
          },
          context
        }).then(res => {
          let data = _lodash.default.head(res);

          data['mmCollection'] = collection;
          return data;
        });
      });
      (0, _defineProperty2.default)(this, "_resolveMany", field => async (parent, args, context, info) => {
        const {
          field: relationField
        } = this.args;
        let {
          mmFieldTypeWrap: fieldTypeWrap,
          mmCollectionName: collection,
          mmStoreField: storeField,
          mmInterfaceModifier
        } = this;

        let whereType = _inputTypes.default.get(fieldTypeWrap.realType(), fieldTypeWrap.isInterface() ? KIND.WHERE_INTERFACE : KIND.WHERE);

        let value = parent[storeField];
        if (!value) return fieldTypeWrap.isRequired() ? [] : null;
        let selector = {};

        if (!fieldTypeWrap.isAbstract()) {
          selector = await (0, _utils2.applyInputTransform)({
            parent,
            context
          })(args.where, whereType);
        }

        if (fieldTypeWrap.isInterface()) {
          selector = Transforms.validateAndTransformInterfaceInput(whereType)({
            selector
          }).selector;
        }

        selector = { ...selector,
          ...mmInterfaceModifier
        };

        if (args.skip) {
          value = _lodash2.default.drop(value, args.skip);
        }

        if (args.first) {
          value = _lodash2.default.take(value, args.first);
        }

        if (fieldTypeWrap.isAbstract()) {
          let collections = value.reduce((acc, v) => {
            let {
              $ref: col,
              $id: id
            } = v.toJSON();
            acc[col] = !acc[col] ? [id] : [...acc[col], id];
          });
          let queries = Object.entries(collections).map((collection, value) => {
            let options = {
              selectorField: relationField,
              ids: value
            };
            return this._findIDsQuery({
              collection,
              selector,
              options,
              context
            }).then(results => {
              return results.map(r => {
                r['mmCollection'] = collection;
                return r;
              });
            });
          });
          return Promise.all(queries).then(results => {
            let data = [];
            results.forEach(r => data = [...data, ...results]);
            return data;
          });
        } else {
          return this._findIDsQuery({
            collection,
            selector,
            options: {
              selectorField: relationField,
              ids: value
            },
            context
          });
        }
      });
      (0, _defineProperty2.default)(this, "_addConnectionField", field => {
        const {
          field: relationField
        } = this.args;
        let {
          mmFieldTypeWrap: fieldTypeWrap,
          mmCollectionName: collection,
          mmStoreField: storeField
        } = this;
        const {
          _typeMap: SchemaTypes
        } = this.schema;

        let whereType = _inputTypes.default.get(fieldTypeWrap.realType(), 'where');

        let orderByType = _inputTypes.default.get(fieldTypeWrap.realType(), 'orderBy');

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
            let value = parent[storeField];

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
                [relationField]: value
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
      (0, _defineProperty2.default)(this, "_distinctQuery", async ({
        selector,
        context
      }) => {
        const {
          field: relationField
        } = this.args;
        let {
          mmCollectionName: collection,
          mmStoreField: storeField,
          mmInterfaceModifier
        } = this;
        selector = { ...selector,
          ...mmInterfaceModifier
        };
        return queryExecutor({
          type: _queryExecutor.DISTINCT,
          collection,
          selector,
          context,
          options: {
            key: relationField
          }
        });
      });
      (0, _defineProperty2.default)(this, "_findIDsQuery", async ({
        collection,
        selector,
        options,
        context
      }) => {
        return queryExecutor({
          type: _queryExecutor.FIND_IDS,
          collection,
          selector,
          options,
          context
        });
      });
      (0, _defineProperty2.default)(this, "_deleteOneQuery", async ({
        selector,
        context
      }) => {
        const {
          field: relationField
        } = this.args;
        let {
          mmCollectionName: collection,
          mmStoreField: storeField,
          mmInterfaceModifier
        } = this;
        selector = { ...selector,
          ...mmInterfaceModifier
        };
        return queryExecutor({
          type: _queryExecutor.DELETE_ONE,
          collection,
          selector,
          context
        }).then(res => res ? res[relationField] : null);
      });
      (0, _defineProperty2.default)(this, "_insertOneQuery", async ({
        doc,
        context
      }) => {
        const {
          field: relationField
        } = this.args;
        let {
          mmCollectionName: collection,
          mmStoreField: storeField,
          mmInterfaceModifier
        } = this;
        doc = { ...doc,
          ...mmInterfaceModifier
        };
        return queryExecutor({
          type: _queryExecutor.INSERT_ONE,
          collection,
          doc,
          context
        }).then(res => res[relationField]);
      });
      (0, _defineProperty2.default)(this, "_insertManyQuery", async ({
        docs,
        context
      }) => {
        const {
          field: relationField
        } = this.args;
        let {
          mmCollectionName: collection,
          mmStoreField: storeField,
          mmInterfaceModifier
        } = this;
        docs = docs.map(doc => ({ ...doc,
          ...mmInterfaceModifier
        }));
        return queryExecutor({
          type: _queryExecutor.INSERT_MANY,
          collection,
          docs,
          context
        }).then(res => res.map(item => item[relationField]));
      });
    }

    visitFieldDefinition(field, {
      objectType
    }) {
      const {
        field: relationField,
        storeField
      } = this.args;
      let fieldTypeWrap = new _typeWrap.default(field.type);
      let isAbstract = fieldTypeWrap.realType().mmAbstract;

      if (!(0, _utils.getDirective)(fieldTypeWrap.realType(), 'model') && !(fieldTypeWrap.isInherited() && (0, _utils.getDirective)(fieldTypeWrap.interfaceType(), 'model')) && !isAbstract) {
        throw `Relation field type should be defined with Model directive. (Field '${field.name}' of type '${fieldTypeWrap.realType().name}')`;
      }

      this.mmObjectType = objectType;
      this.mmFieldTypeWrap = fieldTypeWrap;
      this.mmStoreField = storeField || (0, _utils.getRelationFieldName)(fieldTypeWrap.realType().name, relationField, fieldTypeWrap.isMany());
      (0, _utils2.appendTransform)(field, HANDLER.TRANSFORM_TO_INPUT, {
        [KIND.ORDER_BY]: field => [],
        [KIND.CREATE]: this._transformToInputCreateUpdate,
        [KIND.UPDATE]: this._transformToInputCreateUpdate,
        [KIND.WHERE]: isAbstract ? () => [] : this._transformToInputWhere
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
  let fields = {};
  let typeWrap = new _typeWrap.default(initialType);
  let createType = inputTypes.get(initialType, typeWrap.isInterface() ? KIND.CREATE_INTERFACE : KIND.CREATE);
  let whereType = inputTypes.get(initialType, typeWrap.isInterface() ? KIND.WHERE_INTERFACE : KIND.WHERE);
  let whereUniqueType = inputTypes.get(initialType, typeWrap.isInterface() ? KIND.WHERE_UNIQUE_INTERFACE : KIND.WHERE_UNIQUE);

  if ([INPUT_CREATE_MANY_RELATION, INPUT_UPDATE_MANY_RELATION, INPUT_UPDATE_MANY_REQUIRED_RELATION].includes(kind)) {
    createType = new _graphql.GraphQLList(createType);
    whereType = new _graphql.GraphQLList(whereType);
    whereUniqueType = new _graphql.GraphQLList(whereUniqueType);
  }

  fields.create = {
    name: 'create',
    type: createType,
    mmTransform: createInputTransform(createType, typeWrap.isInterface())
  };
  fields.connect = {
    name: 'connect',
    type: whereUniqueType,
    mmTransform: createInputTransform(whereUniqueType, typeWrap.isInterface())
  };

  if (kind === INPUT_UPDATE_ONE_RELATION) {
    fields.disconnect = {
      name: 'disconnect',
      type: _graphql.GraphQLBoolean
    }; // fields.delete = {
    //   name: 'delete',
    //   type: GraphQLBoolean,
    // };
  }

  if ([INPUT_UPDATE_MANY_RELATION, INPUT_UPDATE_MANY_REQUIRED_RELATION].includes(kind)) {
    fields.disconnect = {
      name: 'disconnect',
      type: whereType,
      mmTransform: createInputTransform(whereType, typeWrap.isInterface())
    };
    fields.delete = {
      name: 'delete',
      type: whereUniqueType,
      mmTransform: createInputTransform(whereUniqueType, typeWrap.isInterface())
    };
  }

  let newType = new _graphql.GraphQLInputObjectType({
    name,
    fields
  });
  newType.getFields();
  return newType;
};

_inputTypes.default.registerKind(INPUT_CREATE_ONE_RELATION, createInput);

_inputTypes.default.registerKind(INPUT_CREATE_MANY_RELATION, createInput);

_inputTypes.default.registerKind(INPUT_UPDATE_ONE_RELATION, createInput);

_inputTypes.default.registerKind(INPUT_UPDATE_MANY_RELATION, createInput);

_inputTypes.default.registerKind(INPUT_UPDATE_ONE_REQUIRED_RELATION, createInput);

_inputTypes.default.registerKind(INPUT_UPDATE_MANY_REQUIRED_RELATION, createInput);