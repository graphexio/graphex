"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.EmptyTypeException = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _lodash = _interopRequireDefault(require("lodash"));

var _graphql = require("graphql");

var _utils = require("./utils");

var _typeWrap = _interopRequireDefault(require("../typeWrap"));

var KIND = _interopRequireWildcard(require("./kinds"));

var Transforms = _interopRequireWildcard(require("./transforms"));

const ObjectHash = require('object-hash');

const ModifierTypes = {
  'in': type => new _graphql.GraphQLList(type),
  'not_in': type => new _graphql.GraphQLList(type),
  'not': null,
  'exists': _graphql.GraphQLBoolean,
  'lt': null
};
const Modifiers = {
  Boolean: ['', 'not', 'exists'],
  ID: ['', 'in', 'not_in', 'exists'],
  ObjectID: ['', 'in', 'not', 'not_in', 'exists'],
  Int: ['', 'in', 'not', 'not_in', 'lt', 'lte', 'gt', 'gte', 'exists'],
  Float: ['', 'in', 'not', 'not_in', 'lt', 'lte', 'gt', 'gte', 'exists'],
  Date: ['', 'not', 'lt', 'lte', 'gt', 'gte', 'exists'],
  String: ['', 'not', 'in', 'not_in', 'lt', 'lte', 'gt', 'gte', 'contains', 'icontains', 'not_contains', 'not_icontains', 'starts_with', 'istarts_with', 'not_starts_with', 'not_istarts_with', 'ends_with', 'iends_with', 'not_ends_with', 'not_iends_with', 'exists']
};

class EmptyTypeException extends Error {
  constructor(type) {
    super();
    (0, _defineProperty2.default)(this, "toString", () => `Type ${this._type.name} must define one or more fields`);
    this._type = type;
  }

}

exports.EmptyTypeException = EmptyTypeException;

class InputTypesClass {
  constructor(SchemaTypes) {
    (0, _defineProperty2.default)(this, "Kinds", []);
    (0, _defineProperty2.default)(this, "_defaultTransformToInputOrderBy", ({
      field
    }) => [{
      name: `${field.name}_ASC`,
      value: {
        [field.name]: 1
      },
      mmTransform: (0, _utils.reduceTransforms)([field.mmTransform ? field.mmTransform : params => params, Transforms.fieldInputTransform(field, KIND.ORDER_BY)])
    }, {
      name: `${field.name}_DESC`,
      value: {
        [field.name]: -1
      },
      mmTransform: (0, _utils.reduceTransforms)([field.mmTransform ? field.mmTransform : params => params, Transforms.fieldInputTransform(field, KIND.ORDER_BY)])
    }]);
    (0, _defineProperty2.default)(this, "_defaultTransformToInputCreateUpdate", ({
      field,
      kind
    }) => {
      let isCreate = kind === KIND.CREATE;
      let fieldTypeWrap = new _typeWrap.default(field.type);
      let typeWrap = fieldTypeWrap.clone();
      let type = typeWrap.type();

      if (fieldTypeWrap.isNested()) {
        typeWrap.setRealType(this._inputType(fieldTypeWrap.realType(), fieldTypeWrap.isMany() ? isCreate ? KIND.CREATE_MANY_NESTED : KIND.UPDATE_MANY_NESTED : isCreate ? KIND.CREATE_ONE_NESTED : KIND.UPDATE_ONE_NESTED));
        typeWrap.setMany(false);
      }

      if (!isCreate) {
        typeWrap.setRequired(false);
      }

      return [{
        type,
        name: field.name,
        mmTransform: (0, _utils.reduceTransforms)([// Transforms.log(1),
        Transforms.fieldInputTransform(field, kind), // Transforms.log(2),
        fieldTypeWrap.isNested() ? Transforms.applyNestedTransform(type) : null, // Transforms.log(3),
        fieldTypeWrap.isNested() ? Transforms.validateAndTransformNestedInput(type, fieldTypeWrap.isMany()) : null, // Transforms.log(4),
        fieldTypeWrap.isInterface() ? Transforms.validateAndTransformInterfaceInput(type) : null, // Transforms.log(5),
        !isCreate && fieldTypeWrap.isNested() ? params => !_lodash.default.isArray(_lodash.default.head(_lodash.default.values(params))) ? Transforms.flattenNested(params) : params : null])
      }];
    });
    (0, _defineProperty2.default)(this, "_defaultTransformToInputWhere", ({
      field
    }) => {
      let fieldTypeWrap = new _typeWrap.default(field.type);
      let fields = [];

      if (fieldTypeWrap.isNested()) {
        let type = this._inputType(fieldTypeWrap.realType(), fieldTypeWrap.isInterface() ? KIND.WHERE_INTERFACE : KIND.WHERE);

        fields.push({
          type,
          name: field.name,
          mmTransform: (0, _utils.reduceTransforms)([Transforms.fieldInputTransform(field, KIND.WHERE), Transforms.applyNestedTransform(type), // Transforms.validateAndTransformNestedInput(type),
          fieldTypeWrap.isInterface() ? Transforms.validateAndTransformInterfaceInput(type) : null, Transforms.flattenNested])
        });
      }

      if (fieldTypeWrap.isMany()) {
        [{
          modifier: '',
          type: _graphql.GraphQLString
        }, {
          modifier: 'size',
          type: _graphql.GraphQLInt
        }, {
          modifier: 'not_size',
          type: _graphql.GraphQLInt
        }, {
          modifier: 'exists',
          type: _graphql.GraphQLBoolean
        }, {
          modifier: 'all',
          type: new _graphql.GraphQLList(_graphql.GraphQLString)
        }, {
          modifier: 'exact',
          type: new _graphql.GraphQLList(_graphql.GraphQLString)
        }, {
          modifier: 'in',
          type: new _graphql.GraphQLList(_graphql.GraphQLString)
        }, {
          modifier: 'nin',
          type: new _graphql.GraphQLList(_graphql.GraphQLString)
        }].forEach(({
          modifier,
          type
        }) => {
          fields.push({
            type,
            name: this._fieldNameWithModifier(field.name, modifier),
            mmTransform: (0, _utils.reduceTransforms)([Transforms.fieldInputTransform(field, KIND.WHERE), Transforms.transformModifier(modifier)])
          });
        });
      } else if (Modifiers[fieldTypeWrap.realType()]) {
        ////Modifiers for scalars
        Modifiers[fieldTypeWrap.realType()].forEach(modifier => {
          let type = fieldTypeWrap.realType();

          if (['in', 'not_in'].includes(modifier)) {
            type = new _graphql.GraphQLList(type);
          }

          fields.push({
            type,
            name: this._fieldNameWithModifier(field.name, modifier),
            mmTransform: (0, _utils.reduceTransforms)([Transforms.transformModifier(modifier), Transforms.fieldInputTransform(field, KIND.WHERE)])
          });
        });
      }

      return fields;
    });
    (0, _defineProperty2.default)(this, "_fieldNameWithModifier", (name, modifier) => {
      if (modifier != '') {
        return `${name}_${modifier}`;
      } else {
        return name;
      }
    });
    (0, _defineProperty2.default)(this, "_type", typeName => {
      if (!this.SchemaTypes[typeName]) throw `Type ${typeName} not found`;
      return this.SchemaTypes[typeName];
    });
    (0, _defineProperty2.default)(this, "_inputTypeName", (typeName, kind) => {
      return `${typeName}${kind.charAt(0).toUpperCase() + kind.slice(1)}Input`;
    });
    (0, _defineProperty2.default)(this, "_createInputEnum", ({
      name,
      initialType,
      kind
    }) => {
      let deafultTransformFunc = this._defaultTransformToInput[kind];
      let values = [];

      _lodash.default.values(initialType._fields).forEach(field => {
        let {
          mmTransformToInput = {}
        } = field;
        let transformFunc = mmTransformToInput[kind] || deafultTransformFunc;
        values = [...values, ...transformFunc({
          field,
          kind,
          inputTypes: this
        })];
      });

      let newType = new _graphql.GraphQLEnumType({
        name,
        values: this._fieldsArrayToObject(values)
      });
      return newType;
    });
    (0, _defineProperty2.default)(this, "_createInputObject", ({
      name,
      initialType,
      kind
    }) => {
      let newType = new _graphql.GraphQLInputObjectType({
        name,
        fields: {}
      });
      newType.getFields();
      return newType;
    });
    (0, _defineProperty2.default)(this, "_createInputWithWhereNested", ({
      name,
      initialType
    }) => {
      let typeWrap = new _typeWrap.default(initialType);
      let newType = new _graphql.GraphQLInputObjectType({
        name,
        fields: {
          where: {
            name: 'where',
            type: this._inputType(initialType, KIND.WHERE)
          },
          data: {
            name: 'data',
            type: this._inputType(initialType, typeWrap.isInterface() ? KIND.UPDSTE_INTERFACE : KIND.UPDATE)
          }
        }
      });
      newType.getFields();
      return newType;
    });
    (0, _defineProperty2.default)(this, "_addAndOr", (fields, type) => {
      let manyType = new _graphql.GraphQLList(type);
      fields.AND = {
        name: 'AND',
        type: manyType,
        mmTransform: async (params, context) => {
          params = await (0, _utils.applyInputTransform)(context)(params.AND, manyType);
          return {
            $and: params
          };
        }
      };
      fields.OR = {
        name: 'OR',
        type: manyType,
        mmTransform: async (params, context) => {
          params = await (0, _utils.applyInputTransform)(context)(params.OR, manyType);
          return {
            $or: params
          };
        }
      };
    });
    (0, _defineProperty2.default)(this, "_fillInputObject", ({
      type,
      initialType,
      kind
    }) => {
      let defaultTransformFunc = this._defaultTransformToInput[kind];
      let fields = {};

      if (kind === KIND.WHERE) {
        this._addAndOr(fields, type);
      }

      _lodash.default.values(initialType._fields).forEach(field => {
        let {
          mmTransformToInput = {}
        } = field;
        let transformFunc = mmTransformToInput[kind] || defaultTransformFunc;

        if (kind === KIND.WHERE && transformFunc !== this._defaultTransformToInputWhere) {
          fields = { ...fields,
            ...this._fieldsArrayToObject(this._defaultTransformToInputWhere({
              field
            }))
          };
        }

        fields = { ...fields,
          ...this._fieldsArrayToObject(transformFunc({
            field,
            kind,
            inputTypes: this
          }))
        };
      });

      type._fields = fields;
    });
    (0, _defineProperty2.default)(this, "_fillInputObjectInterface", ({
      type,
      initialType,
      kind
    }) => {
      kind = {
        [KIND.WHERE_INTERFACE]: KIND.WHERE,
        [KIND.WHERE_UNIQUE_INTERFACE]: KIND.WHERE_UNIQUE,
        [KIND.CREATE_INTERFACE]: KIND.CREATE,
        [KIND.UPDATE_INTERFACE]: KIND.UPDATE
      }[kind];

      let fieldsArr = _lodash.default.values(this.SchemaTypes).filter(itype => _lodash.default.isArray(itype._interfaces) && itype._interfaces.includes(initialType));

      if ([KIND.WHERE, KIND.UPDATE, KIND.WHERE_UNIQUE].includes(kind)) {
        fieldsArr.push(initialType);
      }

      fieldsArr = fieldsArr.map(fieldType => {
        let mmTransform;
        let inputType;

        try {
          inputType = this._inputType(fieldType, kind);
        } catch (e) {
          return null;
        }

        if ([KIND.CREATE, KIND.WHERE, KIND.UPDATE, KIND.WHERE_UNIQUE].includes(kind) && fieldType !== initialType && fieldType.mmDiscriminator && initialType.mmDiscriminatorField) {
          mmTransform = (0, _utils.reduceTransforms)([Transforms.applyNestedTransform(inputType), kind === KIND.UPDATE ? params => _lodash.default.mapValues(params, val => ({ ...val,
            [initialType.mmDiscriminatorField]: {
              $mmEquals: fieldType.mmDiscriminator
            }
          })) : params => _lodash.default.mapValues(params, val => ({ ...val,
            [initialType.mmDiscriminatorField]: fieldType.mmDiscriminator
          }))]);
        }

        return {
          name: fieldType.name,
          type: inputType,
          mmTransform
        };
      });
      type._fields = this._fieldsArrayToObject(fieldsArr);
    });
    (0, _defineProperty2.default)(this, "_createInputNestedObject", ({
      name,
      initialType,
      kind
    }) => {
      let isInterface = initialType instanceof _graphql.GraphQLInterfaceType;
      let isMany = [KIND.CREATE_MANY_NESTED, KIND.CREATE_MANY_REQUIRED_NESTED, KIND.UPDATE_MANY_NESTED, KIND.UPDATE_MANY_REQUIRED_NESTED].includes(kind);
      let fields = {};

      if ([KIND.CREATE_ONE_NESTED, KIND.CREATE_ONE_REQUIRED_NESTED, KIND.CREATE_MANY_NESTED, KIND.CREATE_MANY_REQUIRED_NESTED, KIND.UPDATE_ONE_NESTED, KIND.UPDATE_ONE_REQUIRED_NESTED, KIND.UPDATE_MANY_NESTED, KIND.UPDATE_MANY_REQUIRED_NESTED].includes(kind)) {
        let type = this._inputType(initialType, isInterface ? KIND.CREATE_INTERFACE : KIND.CREATE);

        if (isMany) {
          type = new _graphql.GraphQLList(type);
        }

        fields.create = {
          name: 'create',
          type,
          mmTransform: (0, _utils.reduceTransforms)([Transforms.applyNestedTransform(type), [KIND.UPDATE_MANY_NESTED, KIND.UPDATE_MANY_REQUIRED_NESTED].includes(kind) ? params => _lodash.default.mapValues(params, val => ({
            $mmPushAll: val
          })) : null])
        };
      }

      if ([KIND.UPDATE_ONE_NESTED, KIND.UPDATE_ONE_REQUIRED_NESTED].includes(kind)) {
        let type = this._inputType(initialType, isInterface ? KIND.UPDATE_INTERFACE : KIND.UPDATE);

        fields.update = {
          name: 'update',
          type,
          mmTransform: (0, _utils.reduceTransforms)([Transforms.applyNestedTransform(type), !isInterface ? params => ({
            update: { ...params.update,
              $mmExists: true
            }
          }) : null])
        };
      }

      if ([KIND.UPDATE_ONE_NESTED].includes(kind)) {
        fields.delete = {
          name: 'delete',
          type: _graphql.GraphQLBoolean,
          mmTransform: params => _lodash.default.mapValues(params, val => ({
            $mmUnset: true
          }))
        };
      }

      if ([KIND.UPDATE_MANY_NESTED, KIND.UPDATE_MANY_REQUIRED_NESTED].includes(kind)) {
        let updateType = new _graphql.GraphQLList(this._inputType(initialType, KIND.UPDATE_WITH_WHERE_NESTED));
        fields.updateMany = {
          name: 'updateMany',
          type: updateType,
          mmTransform: (0, _utils.reduceTransforms)([Transforms.applyNestedTransform(updateType), params => _lodash.default.mapValues(params, arr => {
            let result = {};
            arr.forEach(({
              data,
              where
            }) => {
              let hash = ObjectHash(where);
              result[`$[${hash}]`] = { ...data,
                $mmArrayFilter: Transforms.flattenNested({
                  [hash]: where
                })
              };
            });
            return Transforms.flattenNested(result);
          })])
        };
        let whereType = new _graphql.GraphQLList(this._inputType(initialType, isInterface ? KIND.WHERE_INTERFACE : KIND.WHERE));
        fields.deleteMany = {
          name: 'deleteMany',
          type: whereType,
          mmTransform: (0, _utils.reduceTransforms)([Transforms.applyNestedTransform(whereType), params => _lodash.default.mapValues(params, val => ({
            $mmPull: {
              $or: val
            }
          }))])
        };
      }

      let newType = new _graphql.GraphQLInputObjectType({
        name,
        fields
      });
      newType.getFields();
      return newType;
    });
    (0, _defineProperty2.default)(this, "_fieldsArrayToObject", arr => {
      let res = {};
      arr.forEach(field => {
        if (field) {
          res[field.name] = field;
        }
      });
      return res;
    });
    (0, _defineProperty2.default)(this, "_schemaRollback", snapshotTypes => {
      _lodash.default.difference(_lodash.default.keys(this.SchemaTypes), _lodash.default.keys(snapshotTypes)).forEach(typeName => {
        delete this.SchemaTypes[typeName];
      });
    });
    (0, _defineProperty2.default)(this, "_createInputType", (name, initialType, kind) => {
      let {
        init,
        fill
      } = this.Kinds[kind];
      if (!init) throw `Unknown kind ${kind}`;

      let snapshotTypes = _lodash.default.clone(this.SchemaTypes);

      let type = init({
        name,
        initialType,
        kind,
        inputTypes: this
      });
      this.SchemaTypes[name] = type;

      if (fill) {
        try {
          fill({
            type,
            initialType,
            kind
          });
        } catch (e) {
          this._schemaRollback(snapshotTypes);

          throw e;
        }
      }

      if (_lodash.default.isEmpty(type._fields) && _lodash.default.isEmpty(type._values)) {
        this._schemaRollback(snapshotTypes);

        throw new EmptyTypeException(type);
      }

      return type;
    });
    (0, _defineProperty2.default)(this, "_inputType", (type, kind) => {
      if (typeof type === String) {
        type = this._type(type);
      }

      let typeName = this._inputTypeName(type.name, kind);

      try {
        return this._type(typeName);
      } catch (err) {
        return this._createInputType(typeName, type, kind);
      }
    });
    (0, _defineProperty2.default)(this, "exist", this._type);
    (0, _defineProperty2.default)(this, "get", this._inputType);
    (0, _defineProperty2.default)(this, "registerKind", (kind, init, fill) => {
      if (_lodash.default.isArray(kind)) {
        kind.forEach(item => {
          this.registerKind(item, init, fill);
        });
      } else {
        if (this.Kinds[kind]) throw `Kind ${kind} already registered`;
        this.Kinds[kind] = {
          init,
          fill
        };
      }
    });
    (0, _defineProperty2.default)(this, "setSchemaTypes", schemaTypes => {
      this.SchemaTypes = schemaTypes;
    });
    this.SchemaTypes = SchemaTypes;
    this._defaultTransformToInput = {
      [KIND.ORDER_BY]: this._defaultTransformToInputOrderBy,
      [KIND.WHERE]: this._defaultTransformToInputWhere,
      [KIND.WHERE_UNIQUE]: () => [],
      [KIND.CREATE]: this._defaultTransformToInputCreateUpdate,
      [KIND.UPDATE]: this._defaultTransformToInputCreateUpdate
    };
    this.registerKind([KIND.CREATE, KIND.WHERE, KIND.WHERE_UNIQUE, KIND.UPDATE], this._createInputObject, this._fillInputObject);
    this.registerKind(KIND.ORDER_BY, this._createInputEnum);
    this.registerKind([KIND.CREATE_INTERFACE, KIND.WHERE_INTERFACE, KIND.UPDATE_INTERFACE, KIND.WHERE_UNIQUE_INTERFACE], this._createInputObject, this._fillInputObjectInterface);
    this.registerKind([KIND.CREATE_ONE_NESTED, KIND.CREATE_MANY_NESTED, KIND.CREATE_ONE_REQUIRED_NESTED, KIND.CREATE_MANY_REQUIRED_NESTED, KIND.UPDATE_ONE_NESTED, KIND.UPDATE_MANY_NESTED], this._createInputNestedObject);
    this.registerKind(KIND.UPDATE_WITH_WHERE_NESTED, this._createInputWithWhereNested);
  }

}

const InputTypes = new InputTypesClass();
var _default = InputTypes;
exports.default = _default;