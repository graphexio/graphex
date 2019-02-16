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
import TypeWrap from '../typeWrap';
import * as KIND from './kinds';
import * as Transforms from './transforms';
import { lowercaseFirstLetter } from '../utils';
import pluralize from 'pluralize';

const ObjectHash = require('object-hash');

const ModifierTypes = {
  in: type => new GraphQLList(type),
  not_in: type => new GraphQLList(type),
  not: null,
  exists: GraphQLBoolean,
  lt: null,
};

const Modifiers = {
  Boolean: ['', 'not', 'exists'],
  ID: ['', 'in', 'not_in', 'exists'],
  ObjectID: ['', 'in', 'not', 'not_in', 'exists'],
  Int: ['', 'in', 'not', 'not_in', 'lt', 'lte', 'gt', 'gte', 'exists'],
  Float: ['', 'in', 'not', 'not_in', 'lt', 'lte', 'gt', 'gte', 'exists'],
  Date: ['', 'not', 'lt', 'lte', 'gt', 'gte', 'exists'],
  String: [
    '',
    'not',
    'in',
    'not_in',
    'lt',
    'lte',
    'gt',
    'gte',
    'contains',
    'icontains',
    'not_contains',
    'not_icontains',
    'starts_with',
    'istarts_with',
    'not_starts_with',
    'not_istarts_with',
    'ends_with',
    'iends_with',
    'not_ends_with',
    'not_iends_with',
    'exists',
  ],
};

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
  console.log({ val });
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

class InputTypesClass {
  Kinds = [];

  constructor(SchemaTypes) {
    this.SchemaTypes = SchemaTypes;

    this._defaultTransformToInput = {
      [KIND.ORDER_BY]: this._defaultTransformToInputOrderBy,
      [KIND.WHERE]: this._defaultTransformToInputWhere,
      [KIND.WHERE_UNIQUE]: () => [],
      [KIND.CREATE]: this._defaultTransformToInputCreateUpdate,
      [KIND.UPDATE]: this._defaultTransformToInputCreateUpdate,
    };

    this.registerKind(
      [KIND.CREATE, KIND.WHERE, KIND.WHERE_UNIQUE, KIND.UPDATE],
      this._createInputObject,
      this._fillInputObject
    );

    this.registerKind(KIND.ORDER_BY, this._createInputEnum);
    this.registerKind(
      [
        KIND.CREATE_INTERFACE,
        KIND.WHERE_INTERFACE,
        KIND.UPDATE_INTERFACE,
        KIND.WHERE_UNIQUE_INTERFACE,
      ],
      this._createInputObject,
      this._fillInputObjectInterface
    );
    this.registerKind(
      [
        KIND.CREATE_ONE_NESTED,
        KIND.CREATE_MANY_NESTED,
        KIND.CREATE_ONE_REQUIRED_NESTED,
        KIND.CREATE_MANY_REQUIRED_NESTED,
        KIND.UPDATE_ONE_NESTED,
        KIND.UPDATE_MANY_NESTED,
      ],
      this._createInputNestedObject
    );

    this.registerKind(
      KIND.UPDATE_WITH_WHERE_NESTED,
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

  _defaultTransformToInputCreateUpdate = ({ field, kind }) => {
    let isCreate = kind === KIND.CREATE;
    let fieldTypeWrap = new TypeWrap(field.type);
    let typeWrap = fieldTypeWrap.clone();

    if (fieldTypeWrap.isNested()) {
      typeWrap.setRealType(
        this._inputType(
          fieldTypeWrap.realType(),
          fieldTypeWrap.isMany()
            ? isCreate
              ? KIND.CREATE_MANY_NESTED
              : KIND.UPDATE_MANY_NESTED
            : isCreate
            ? KIND.CREATE_ONE_NESTED
            : KIND.UPDATE_ONE_NESTED
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

  _defaultTransformToInputWhere = ({ field }) => {
    let fieldTypeWrap = new TypeWrap(field.type);
    let fields = [];

    if (fieldTypeWrap.isNested()) {
      let type = this._inputType(
        fieldTypeWrap.realType(),
        fieldTypeWrap.isInterface() ? KIND.WHERE_INTERFACE : KIND.WHERE
      );
      fields.push({
        type,
        name: field.name,
        mmTransform: reduceTransforms([
          Transforms.fieldInputTransform(field, KIND.WHERE),
          Transforms.applyNestedTransform(type),
          // Transforms.validateAndTransformNestedInput(type),
          fieldTypeWrap.isInterface()
            ? Transforms.validateAndTransformInterfaceInput(type)
            : null,
          Transforms.flattenNested,
        ]),
      });
    }
    if (fieldTypeWrap.isMany()) {
      [
        { modifier: '', type: GraphQLString },
        { modifier: 'size', type: GraphQLInt },
        { modifier: 'not_size', type: GraphQLInt },
        { modifier: 'exists', type: GraphQLBoolean },
        { modifier: 'all', type: new GraphQLList(GraphQLString) },
        { modifier: 'exact', type: new GraphQLList(GraphQLString) },
        { modifier: 'in', type: new GraphQLList(GraphQLString) },
        { modifier: 'nin', type: new GraphQLList(GraphQLString) },
      ].forEach(({ modifier, type }) => {
        fields.push({
          type,
          name: this._fieldNameWithModifier(field.name, modifier),
          mmTransform: reduceTransforms([
            Transforms.fieldInputTransform(field, KIND.WHERE),
            Transforms.transformModifier(modifier),
            // this._applyNestedTransform(type),
            // this._validateAndTransformNestedInput(type),
            // fieldTypeWrap.isInterface()
            //   ? this._validateAndTransformInterfaceInput(type)
            //   : null,
            // this._flattenNested,
          ]),
        });
      });
    } else if (Modifiers[fieldTypeWrap.realType()]) {
      ////Modifiers for scalars
      Modifiers[fieldTypeWrap.realType()].forEach(modifier => {
        let type = fieldTypeWrap.realType();
        if (['in', 'not_in'].includes(modifier)) {
          type = new GraphQLList(type);
        }
        fields.push({
          type,
          name: this._fieldNameWithModifier(field.name, modifier),
          mmTransform: reduceTransforms([
            Transforms.transformModifier(modifier),
            Transforms.fieldInputTransform(field, KIND.WHERE),
          ]),
        });
      });
    }
    return fields;
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

  _inputTypeName = (typeName, kind) => {
    return `${typeName}${kind.charAt(0).toUpperCase() + kind.slice(1)}Input`;
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
      values = [...values, ...transformFunc({ field, kind, inputTypes: this })];
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
          type: this._inputType(initialType, KIND.WHERE),
        },
        data: {
          name: 'data',
          type: this._inputType(
            initialType,
            typeWrap.isInterface() ? KIND.UPDSTE_INTERFACE : KIND.UPDATE
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
    if (kind === KIND.WHERE) {
      this._addAndOr(fields, type);
    }

    Object.values(initialType._fields).forEach(field => {
      let { mmTransformToInput = {} } = field;
      let transformFunc = mmTransformToInput[kind] || defaultTransformFunc;
      if (
        kind === KIND.WHERE &&
        transformFunc !== this._defaultTransformToInputWhere
      ) {
        fields = {
          ...fields,
          ...this._fieldsArrayToObject(
            this._defaultTransformToInputWhere({ field })
          ),
        };
      }
      fields = {
        ...fields,
        ...this._fieldsArrayToObject(
          transformFunc({ field, kind, inputTypes: this })
        ),
      };
    });
    type._fields = fields;
  };

  _fillInputObjectInterface = ({ type, initialType, kind }) => {
    kind = {
      [KIND.WHERE_INTERFACE]: KIND.WHERE,
      [KIND.WHERE_UNIQUE_INTERFACE]: KIND.WHERE_UNIQUE,
      [KIND.CREATE_INTERFACE]: KIND.CREATE,
      [KIND.UPDATE_INTERFACE]: KIND.UPDATE,
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
      [KIND.WHERE, KIND.UPDATE, KIND.WHERE_UNIQUE].includes(kind) &&
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
        return null;
      }
      if (
        [KIND.CREATE, KIND.WHERE, KIND.UPDATE, KIND.WHERE_UNIQUE].includes(
          kind
        ) &&
        fieldType !== initialType
      ) {
        mmTransform = reduceTransforms([
          Transforms.applyNestedTransform(inputType),
          kind === KIND.UPDATE
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
      KIND.CREATE_MANY_NESTED,
      KIND.CREATE_MANY_REQUIRED_NESTED,
      KIND.UPDATE_MANY_NESTED,
      KIND.UPDATE_MANY_REQUIRED_NESTED,
    ].includes(kind);

    let fields = {};
    if (
      [
        KIND.CREATE_ONE_NESTED,
        KIND.CREATE_ONE_REQUIRED_NESTED,
        KIND.CREATE_MANY_NESTED,
        KIND.CREATE_MANY_REQUIRED_NESTED,
        KIND.UPDATE_ONE_NESTED,
        KIND.UPDATE_ONE_REQUIRED_NESTED,
        KIND.UPDATE_MANY_NESTED,
        KIND.UPDATE_MANY_REQUIRED_NESTED,
      ].includes(kind)
    ) {
      let type = this._inputType(
        initialType,
        isInterface ? KIND.CREATE_INTERFACE : KIND.CREATE
      );
      if (isMany) {
        type = new GraphQLList(type);
      }
      fields.create = {
        name: 'create',
        type,
        mmTransform: reduceTransforms([
          Transforms.applyNestedTransform(type),
          [KIND.UPDATE_MANY_NESTED, KIND.UPDATE_MANY_REQUIRED_NESTED].includes(
            kind
          )
            ? params => _.mapValues(params, val => ({ $mmPushAll: val }))
            : null,
        ]),
      };
    }

    if (
      [KIND.UPDATE_ONE_NESTED, KIND.UPDATE_ONE_REQUIRED_NESTED].includes(kind)
    ) {
      let type = this._inputType(
        initialType,
        isInterface ? KIND.UPDATE_INTERFACE : KIND.UPDATE
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

    if ([KIND.UPDATE_ONE_NESTED].includes(kind)) {
      fields.delete = {
        name: 'delete',
        type: GraphQLBoolean,
        mmTransform: params => _.mapValues(params, val => ({ $mmUnset: true })),
      };
    }

    if (
      [KIND.UPDATE_MANY_NESTED, KIND.UPDATE_MANY_REQUIRED_NESTED].includes(kind)
    ) {
      let updateType = new GraphQLList(
        this._inputType(initialType, KIND.UPDATE_WITH_WHERE_NESTED)
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
          isInterface ? KIND.WHERE_INTERFACE : KIND.WHERE
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
    let typeName = this._inputTypeName(type.name, kind);
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
