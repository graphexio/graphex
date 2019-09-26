import _ from 'lodash';
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { applyInputTransform, reduceTransforms } from './utils';
import { getDirective } from '../utils';
import SDLSyntaxException from '../sdlSyntaxException';
import TypeWrap from '@apollo-model/type-wrap';
import { INPUT_TYPE_KIND } from './kinds';
import * as Transforms from './transforms';
import { lowercaseFirstLetter, uppercaseFirstLetter } from '../utils';
import pluralize from 'pluralize';

import transformToInputWhere from './transformToInputWhere';
import transformToInputWhereClean from './transformToInputWhereClean';

export const UNMARKED_OBJECT_FIELD = 'unmarkedObjectField';

const ObjectHash = require('object-hash');

export class EmptyTypeException extends Error {
  constructor(type) {
    super();
    this._type = type;
  }

  toString = () => `Type ${this._type.name} must define one or more fields`;
}

const addInterfaceValues = (val, initialType, fieldType) => {
  if (initialType.mmAbstract)
    return {
      mmCollectionName: fieldType.mmCollectionName,
    };
  if (initialType.mmDiscriminatorField) {
    return { [initialType.mmDiscriminatorField]: fieldType.mmDiscriminator };
  }
  return {};
};

const addUpdateInterfaceValues = (val, initialType, fieldType) => {
  if (initialType.mmAbstract)
    return {
      mmCollectionName: fieldType.mmCollectionName,
    };
  if (initialType.mmDiscriminatorField) {
    return {
      [initialType.mmDiscriminatorField]: {
        $mmEquals: fieldType.mmDiscriminator,
      },
    };
  }
  return {};
};

export const getInputTypeName = (kind, typeName) => {
  return `${typeName}${uppercaseFirstLetter(kind)}Input`;
};

class InputTypesClass {
  Kinds = [];

  constructor(SchemaTypes) {
    this.SchemaTypes = SchemaTypes;

    this._defaultTransformToInput = {
      [INPUT_TYPE_KIND.ORDER_BY]: this._defaultTransformToInputOrderBy,
      [INPUT_TYPE_KIND.WHERE]: transformToInputWhere,
      [INPUT_TYPE_KIND.WHERE_CLEAN]: transformToInputWhereClean,
      [INPUT_TYPE_KIND.WHERE_UNIQUE]: () => [],
      [INPUT_TYPE_KIND.CREATE]: this._defaultTransformToInputCreateUpdate,
      [INPUT_TYPE_KIND.UPDATE]: this._defaultTransformToInputCreateUpdate,
    };

    this.registerKind(
      [
        INPUT_TYPE_KIND.CREATE,
        INPUT_TYPE_KIND.WHERE,
        INPUT_TYPE_KIND.WHERE_CLEAN,
        INPUT_TYPE_KIND.WHERE_UNIQUE,
        INPUT_TYPE_KIND.UPDATE,
      ],
      this._createInputObject,
      this._fillInputObject
    );

    this.registerKind(INPUT_TYPE_KIND.ORDER_BY, this._createInputEnum);
    this.registerKind(
      [
        INPUT_TYPE_KIND.CREATE_INTERFACE,
        INPUT_TYPE_KIND.WHERE_INTERFACE,
        INPUT_TYPE_KIND.UPDATE_INTERFACE,
        INPUT_TYPE_KIND.WHERE_UNIQUE_INTERFACE,
      ],
      this._createInputObject,
      this._fillInputObjectInterface
    );
    this.registerKind(
      [
        INPUT_TYPE_KIND.CREATE_ONE_NESTED,
        INPUT_TYPE_KIND.CREATE_MANY_NESTED,
        INPUT_TYPE_KIND.CREATE_ONE_REQUIRED_NESTED,
        INPUT_TYPE_KIND.CREATE_MANY_REQUIRED_NESTED,
        INPUT_TYPE_KIND.UPDATE_ONE_NESTED,
        INPUT_TYPE_KIND.UPDATE_MANY_NESTED,
      ],
      this._createInputNestedObject
    );

    this.registerKind(
      INPUT_TYPE_KIND.UPDATE_WITH_WHERE_NESTED,
      this._createInputWithWhereNested
    );
  }

  _defaultTransformToInputOrderBy = ({ field }) => [
    {
      name: `${field.name}_ASC`,
      value: { [field.name]: 1 },
    },
    {
      name: `${field.name}_DESC`,
      value: { [field.name]: -1 },
    },
  ];

  _validateDirectivesForNestedObjects = field => {
    let fieldTypeWrap = new TypeWrap(field.type);
    if (
      getDirective(fieldTypeWrap.realType(), 'model') ||
      getDirective(fieldTypeWrap.realType(), 'abstract')
    ) {
      if (
        !getDirective(field, 'relation') &&
        !getDirective(field, 'extRelation')
      ) {
        throw new SDLSyntaxException(
          `Field '${field.name}' should be marked with @relation or @extRelation directive`,
          UNMARKED_OBJECT_FIELD,
          [field]
        );
      }
    }
    if (!getDirective(fieldTypeWrap.realType(), 'embedded')) {
      throw new SDLSyntaxException(
        `Type '${
          fieldTypeWrap.realType().name
        }' should be marked with @embedded, @abstract or @model directive`,
        UNMARKED_OBJECT_FIELD,
        [field]
      );
    }
  };

  _defaultTransformToInputCreateUpdate = ({ field, kind }) => {
    let isCreate = kind === INPUT_TYPE_KIND.CREATE;
    let fieldTypeWrap = new TypeWrap(field.type);
    let typeWrap = fieldTypeWrap.clone();

    if (fieldTypeWrap.isNested()) {
      this._validateDirectivesForNestedObjects(field);

      typeWrap.setRealType(
        this._inputType(
          fieldTypeWrap.realType(),
          fieldTypeWrap.isMany()
            ? isCreate
              ? INPUT_TYPE_KIND.CREATE_MANY_NESTED
              : INPUT_TYPE_KIND.UPDATE_MANY_NESTED
            : isCreate
            ? INPUT_TYPE_KIND.CREATE_ONE_NESTED
            : INPUT_TYPE_KIND.UPDATE_ONE_NESTED
        )
      );
      typeWrap.setMany(false);
    }

    if (!isCreate) {
      typeWrap.setRequired(false);
    }

    let type = typeWrap.type();

    return [
      {
        type,
        name: field.name,
        mmTransform: reduceTransforms([
          // Transforms.log(1),
          Transforms.fieldInputTransform(field, kind),
          // Transforms.log(2),
          fieldTypeWrap.isNested()
            ? Transforms.applyNestedTransform(type)
            : null,
          // Transforms.log(3),
          fieldTypeWrap.isNested()
            ? Transforms.validateAndTransformNestedInput(
                type,
                fieldTypeWrap.isMany()
              )
            : null,
          // Transforms.log(4),
          fieldTypeWrap.isInterface()
            ? Transforms.validateAndTransformInterfaceInput(type)
            : null,
          // Transforms.log(5),
          !isCreate && fieldTypeWrap.isNested()
            ? params =>
                !Array.isArray(_.head(Object.values(params)))
                  ? Transforms.flattenNested(params)
                  : params
            : null,
          // Transforms.log(6),
        ]),
      },
    ];
  };

  _fieldNameWithModifier = (name, modifier) => {
    if (modifier !== '') {
      return `${name}_${modifier}`;
    } else {
      return name;
    }
  };

  _type = typeName => {
    if (!this.SchemaTypes[typeName]) throw `Type ${typeName} not found`;
    return this.SchemaTypes[typeName];
  };

  _paginationTypeName = typeName => {
    return `${typeName}Pagination`;
  };

  _createInputEnum = ({ name, initialType, kind }) => {
    let deafultTransformFunc = this._defaultTransformToInput[kind];
    let values = [];
    Object.values(initialType._fields).forEach(field => {
      let { mmTransformToInput = {} } = field;
      let transformFunc = mmTransformToInput[kind] || deafultTransformFunc;
      values = [
        ...values,
        ...transformFunc({
          field,
          kind,
          inputTypes: this,
          getInputType: this._inputType,
        }),
      ];
    });

    return new GraphQLEnumType({
      name,
      values: this._fieldsArrayToObject(values),
    });
  };

  _createInputObject = ({ name, initialType, kind }) => {
    let newType = new GraphQLInputObjectType({
      name,
      fields: {},
    });
    if (initialType.mmCollectionName) {
      newType.mmCollectionName = initialType.mmCollectionName;
    }
    newType.getFields();
    return newType;
  };

  _createInputWithWhereNested = ({ name, initialType }) => {
    let typeWrap = new TypeWrap(initialType);
    let newType = new GraphQLInputObjectType({
      name,
      fields: {
        where: {
          name: 'where',
          type: this._inputType(initialType, INPUT_TYPE_KIND.WHERE),
        },
        data: {
          name: 'data',
          type: this._inputType(
            initialType,
            typeWrap.isInterface()
              ? INPUT_TYPE_KIND.UPDATE_INTERFACE
              : INPUT_TYPE_KIND.UPDATE
          ),
        },
      },
    });
    newType.getFields();
    return newType;
  };

  _addAndOr = (fields, type) => {
    let manyType = new GraphQLList(type);
    fields.AND = {
      name: 'AND',
      type: manyType,
      mmTransform: async (params, context) => {
        params = await applyInputTransform(context)(params.AND, manyType);
        return { $and: params };
      },
    };
    fields.OR = {
      name: 'OR',
      type: manyType,
      mmTransform: async (params, context) => {
        params = await applyInputTransform(context)(params.OR, manyType);
        return { $or: params };
      },
    };
  };

  _fillInputObject = ({ type, initialType, kind }) => {
    let defaultTransformFunc = this._defaultTransformToInput[kind];
    let fields = {};
    if (kind === INPUT_TYPE_KIND.WHERE) {
      this._addAndOr(fields, type);
    }

    Object.values(initialType._fields).forEach(field => {
      let { mmTransformToInput = {} } = field;
      let transformFunc = mmTransformToInput[kind] || defaultTransformFunc;
      if (
        kind === INPUT_TYPE_KIND.WHERE &&
        transformFunc !== transformToInputWhere
      ) {
        fields = {
          ...fields,
          ...this._fieldsArrayToObject(
            transformToInputWhere({ field, getInputType: this._inputType })
          ),
        };
      }
      fields = {
        ...fields,
        ...this._fieldsArrayToObject(
          transformFunc({
            field,
            kind,
            inputTypes: this,
            getInputType: this._inputType,
          })
        ),
      };
    });
    type._fields = fields;
  };

  _fillInputObjectInterface = ({ type, initialType, kind }) => {
    kind = {
      [INPUT_TYPE_KIND.WHERE_INTERFACE]: INPUT_TYPE_KIND.WHERE,
      [INPUT_TYPE_KIND.WHERE_UNIQUE_INTERFACE]: INPUT_TYPE_KIND.WHERE_UNIQUE,
      [INPUT_TYPE_KIND.CREATE_INTERFACE]: INPUT_TYPE_KIND.CREATE,
      [INPUT_TYPE_KIND.UPDATE_INTERFACE]: INPUT_TYPE_KIND.UPDATE,
    }[kind];

    let fieldsArr = Object.values(this.SchemaTypes).filter(itype => {
      if (initialType.mmAbstract) {
        return initialType.mmAbstractTypes.includes(itype);
      }
      return (
        Array.isArray(itype._interfaces) &&
        itype._interfaces.includes(initialType)
      );
    });
    if (
      [
        INPUT_TYPE_KIND.WHERE,
        INPUT_TYPE_KIND.UPDATE,
        INPUT_TYPE_KIND.WHERE_UNIQUE,
      ].includes(kind) &&
      !initialType.mmAbstract
    ) {
      fieldsArr.push(initialType);
    }

    fieldsArr = fieldsArr.map(fieldType => {
      let mmTransform;
      let inputType;
      try {
        inputType = this._inputType(fieldType, kind);
      } catch (e) {
        if (e instanceof EmptyTypeException) {
          return null;
        } else {
          throw e;
        }
      }
      if (
        [
          INPUT_TYPE_KIND.CREATE,
          INPUT_TYPE_KIND.WHERE,
          INPUT_TYPE_KIND.UPDATE,
          INPUT_TYPE_KIND.WHERE_UNIQUE,
        ].includes(kind) &&
        fieldType !== initialType
      ) {
        mmTransform = reduceTransforms([
          Transforms.applyNestedTransform(inputType),
          kind === INPUT_TYPE_KIND.UPDATE
            ? params =>
                _.mapValues(params, val => ({
                  ...val,
                  ...addUpdateInterfaceValues(val, initialType, fieldType),
                }))
            : params =>
                _.mapValues(params, val => ({
                  ...val,
                  ...addInterfaceValues(val, initialType, fieldType),
                })),
        ]);
      }

      return {
        name: fieldType.name,
        type: inputType,
        mmTransform,
      };
    });
    type._fields = this._fieldsArrayToObject(fieldsArr);
  };

  _createInputNestedObject = ({ name, initialType, kind }) => {
    let isInterface = initialType instanceof GraphQLInterfaceType;
    let isMany = [
      INPUT_TYPE_KIND.CREATE_MANY_NESTED,
      INPUT_TYPE_KIND.CREATE_MANY_REQUIRED_NESTED,
      INPUT_TYPE_KIND.UPDATE_MANY_NESTED,
      INPUT_TYPE_KIND.UPDATE_MANY_REQUIRED_NESTED,
    ].includes(kind);

    let fields = {};
    if (
      [
        INPUT_TYPE_KIND.CREATE_ONE_NESTED,
        INPUT_TYPE_KIND.CREATE_ONE_REQUIRED_NESTED,
        INPUT_TYPE_KIND.CREATE_MANY_NESTED,
        INPUT_TYPE_KIND.CREATE_MANY_REQUIRED_NESTED,
        INPUT_TYPE_KIND.UPDATE_ONE_NESTED,
        INPUT_TYPE_KIND.UPDATE_ONE_REQUIRED_NESTED,
        INPUT_TYPE_KIND.UPDATE_MANY_NESTED,
        INPUT_TYPE_KIND.UPDATE_MANY_REQUIRED_NESTED,
      ].includes(kind)
    ) {
      let type = this._inputType(
        initialType,
        isInterface ? INPUT_TYPE_KIND.CREATE_INTERFACE : INPUT_TYPE_KIND.CREATE
      );
      if (isMany) {
        type = new GraphQLList(type);
      }
      fields.create = {
        name: 'create',
        type,
        mmTransform: reduceTransforms([
          Transforms.applyNestedTransform(type),
          [
            INPUT_TYPE_KIND.UPDATE_MANY_NESTED,
            INPUT_TYPE_KIND.UPDATE_MANY_REQUIRED_NESTED,
          ].includes(kind)
            ? params => _.mapValues(params, val => ({ $mmPushAll: val }))
            : null,
        ]),
      };

      if (
        [
          INPUT_TYPE_KIND.UPDATE_MANY_NESTED,
          INPUT_TYPE_KIND.UPDATE_MANY_REQUIRED_NESTED,
        ].includes(kind)
      ) {
        fields.recreate = {
          name: 'recreate',
          type,
          mmTransform: reduceTransforms([
            Transforms.applyNestedTransform(type),
          ]),
        };
      }
    }

    if (
      [
        INPUT_TYPE_KIND.UPDATE_ONE_NESTED,
        INPUT_TYPE_KIND.UPDATE_ONE_REQUIRED_NESTED,
      ].includes(kind)
    ) {
      let type = this._inputType(
        initialType,
        isInterface ? INPUT_TYPE_KIND.UPDATE_INTERFACE : INPUT_TYPE_KIND.UPDATE
      );
      fields.update = {
        name: 'update',
        type,
        mmTransform: reduceTransforms([
          Transforms.applyNestedTransform(type),
          !isInterface
            ? params => ({
                update: { ...params.update, $mmExists: true },
              })
            : null,
        ]),
      };
    }

    if ([INPUT_TYPE_KIND.UPDATE_ONE_NESTED].includes(kind)) {
      fields.delete = {
        name: 'delete',
        type: GraphQLBoolean,
        mmTransform: params => _.mapValues(params, val => ({ $mmUnset: true })),
      };
    }

    if (
      [
        INPUT_TYPE_KIND.UPDATE_MANY_NESTED,
        INPUT_TYPE_KIND.UPDATE_MANY_REQUIRED_NESTED,
      ].includes(kind)
    ) {
      let updateType = new GraphQLList(
        this._inputType(initialType, INPUT_TYPE_KIND.UPDATE_WITH_WHERE_NESTED)
      );

      fields.updateMany = {
        name: 'updateMany',
        type: updateType,
        mmTransform: reduceTransforms([
          Transforms.applyNestedTransform(updateType),
          params =>
            _.mapValues(params, arr => {
              let result = {};
              arr.forEach(({ data, where }) => {
                let hash = ObjectHash(where);
                result[`$[${hash}]`] = {
                  ...data,
                  $mmArrayFilter: Transforms.flattenNested({ [hash]: where }),
                };
              });
              return Transforms.flattenNested(result);
            }),
        ]),
      };

      let whereType = new GraphQLList(
        this._inputType(
          initialType,
          isInterface ? INPUT_TYPE_KIND.WHERE_INTERFACE : INPUT_TYPE_KIND.WHERE
        )
      );
      fields.deleteMany = {
        name: 'deleteMany',
        type: whereType,
        mmTransform: reduceTransforms([
          Transforms.applyNestedTransform(whereType),
          params => _.mapValues(params, val => ({ $mmPull: { $or: val } })),
        ]),
      };
    }

    let newType = new GraphQLInputObjectType({
      name,
      fields,
    });
    newType.getFields();
    return newType;
  };

  _fieldsArrayToObject = arr => {
    let res = {};
    arr.forEach(field => {
      if (field) {
        res[field.name] = field;
      }
    });
    return res;
  };

  _schemaRollback = snapshotTypes => {
    _.difference(
      Object.keys(this.SchemaTypes),
      Object.keys(snapshotTypes)
    ).forEach(typeName => {
      delete this.SchemaTypes[typeName];
    });
  };

  _createPaginationType = (name, initialType) => {
    let snapshotTypes = _.clone(this.SchemaTypes);
    let pluralName = lowercaseFirstLetter(pluralize(initialType.name));
    let PaginationCursor = snapshotTypes['Cursor'];
    let newType = new GraphQLObjectType({
      name,
      fields: {
        cursor: {
          name: 'cursor',
          type: new GraphQLNonNull(PaginationCursor),
          description: 'Holds the current pagination information',
        },
        hasMore: {
          type: new GraphQLNonNull(GraphQLBoolean),
          description: 'Does the pagination have more records',
        },
        total: {
          type: new GraphQLNonNull(GraphQLInt),
          description:
            'Total number of records for the provided query without skip and first',
        },
        [pluralName]: {
          type: new GraphQLNonNull(new GraphQLList(initialType)),
          description: 'The records for the current page',
        },
      },
    });
    if (initialType.mmCollectionName) {
      newType.mmCollectionName = initialType.mmCollectionName;
    }
    newType.getFields();
    this.SchemaTypes[name] = newType;

    return newType;
  };

  _createInputType = (name, initialType, kind) => {
    let { init, fill } = this.Kinds[kind];
    if (!init) throw `Unknown kind ${kind}`;

    let snapshotTypes = _.clone(this.SchemaTypes);

    let type = init({ name, initialType, kind, inputTypes: this });
    this.SchemaTypes[name] = type;

    if (fill) {
      try {
        fill({ type, initialType, kind });
      } catch (e) {
        this._schemaRollback(snapshotTypes);
        throw e;
      }
    }
    if (_.isEmpty(type._fields) && _.isEmpty(type._values)) {
      this._schemaRollback(snapshotTypes);
      throw new EmptyTypeException(type);
    }
    return type;
  };

  _paginationType = type => {
    if (typeof type === 'string') {
      type = this._type(type);
    }
    let paginationName = this._paginationTypeName(type.name);
    try {
      return this._type(paginationName);
    } catch (err) {
      return this._createPaginationType(paginationName, type);
    }
  };

  _inputType = (type, kind) => {
    if (typeof type === 'string') {
      type = this._type(type);
    }
    let typeName = getInputTypeName(kind, type.name);
    try {
      return this._type(typeName);
    } catch (err) {
      return this._createInputType(typeName, type, kind);
    }
  };

  exist = this._type;
  get = this._inputType;

  registerKind = (kind, init, fill) => {
    if (Array.isArray(kind)) {
      kind.forEach(item => {
        this.registerKind(item, init, fill);
      });
    } else {
      if (this.Kinds[kind]) throw `Kind ${kind} already registered`;
      this.Kinds[kind] = { init, fill };
    }
  };

  setSchemaTypes = schemaTypes => {
    this.SchemaTypes = schemaTypes;
  };
}

const InputTypes = new InputTypesClass();
export default InputTypes;
