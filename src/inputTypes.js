import _ from 'lodash';
import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLBoolean,
} from 'graphql';
import {
  getLastType,
  hasQLListType,
  cloneSchema,
  cloneSchemaOptional,
  addResolveMapFilterToSelector,
  asyncForEach,
} from './utils';

const Modifiers = {
  Boolean: ['', 'not', 'exists'],
  ID: ['', 'in', 'not_in', 'exists'],
  ObjectID: ['', 'in', 'not_in', 'exists'],
  Int: ['', 'in', 'not_in', 'lt', 'lte', 'gt', 'gte', 'exists'],
  Float: ['', 'in', 'not_in', 'lt', 'lte', 'gt', 'gte', 'exists'],
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
    'not_contains',
    'starts_with',
    'not_starts_with',
    'ends_with',
    'not_ends_with',
    'exists',
  ],
};

export const INPUT_CREATE = 'create';
export const INPUT_WHERE = 'where';
export const INPUT_WHERE_UNIQUE = 'whereUnique';
export const INPUT_ORDER_BY = 'orderBy';
export const INPUT_UPDATE = 'update';

export const TRANSFORM_TO_INPUT = 'mmTransformToInput';
export const TRANSFORM_INPUT = 'mmTransformInput';

export default class InputTypes {
  Kinds = [];

  constructor({ SchemaTypes }) {
    this.SchemaTypes = SchemaTypes;

    this._defaultTransformToInput = {
      [INPUT_ORDER_BY]: this._defaultTransformToInputOrderBy,
      [INPUT_WHERE]: this._defaultTransformToInputWhere,
      [INPUT_WHERE_UNIQUE]: () => [],
      [INPUT_CREATE]: this._defaultTransformToInputCreate,
      [INPUT_UPDATE]: this._defaultTransformToInputUpdate,
    };

    this.registerKind(INPUT_CREATE, this._createInputObject);
    this.registerKind(INPUT_WHERE, this._createInputObject);
    this.registerKind(INPUT_WHERE_UNIQUE, this._createInputObject);
    this.registerKind(INPUT_ORDER_BY, this._createInputEnum);
    this.registerKind(INPUT_UPDATE, this._createInputObject);
    this.registerKind;
  }

  _defaultTransformToInputOrderBy = field => [
    {
      name: `${field.name}_ASC`,
      value: { [field.name]: 1 },
    },
    {
      name: `${field.name}_DESC`,
      value: { [field.name]: -1 },
    },
  ];

  _defaultTransformToInputUpdate = field => {
    let lastType = getLastType(field.type);
    let newFieldType = lastType;
    if (lastType instanceof GraphQLObjectType) {
      newFieldType = this._inputType(lastType, INPUT_UPDATE);
    }

    const { mmTransformInput = {} } = field;
    let transformFunc = mmTransformInput[INPUT_UPDATE];
    return [
      {
        ...field,
        type: cloneSchemaOptional(field.type, newFieldType),
        name: field.name,
        mmTransform: async params => {
          if (transformFunc) {
            params = await transformFunc(params);
          }
          return params;
        },
      },
    ];
  };

  _defaultTransformToInputCreate = field => {
    let lastType = getLastType(field.type);
    let newFieldType = lastType;
    if (lastType instanceof GraphQLObjectType) {
      newFieldType = this._inputType(lastType, INPUT_CREATE);
    }

    const { mmTransformInput = {} } = field;
    let transformFunc = mmTransformInput[INPUT_CREATE];
    return [
      {
        ...field,
        type: cloneSchema(field.type, newFieldType),
        name: field.name,
        mmTransform: async params => {
          if (transformFunc) {
            params = await transformFunc(params);
          }
          return params;
        },
      },
    ];
  };

  _defaultTransformToInputWhere = field => {
    let lastType = getLastType(field.type);
    let isMany = hasQLListType(field.type);
    let newFieldType = lastType;

    let fields = [];
    if (lastType instanceof GraphQLObjectType) {
      ////Modifiers for embedded objects
      let fieldName = field.name;
      fields.push(
        this._wrapTransformInputObjectWhere(
          {
            type: this._inputType(lastType, 'where'),
            name: fieldName,
          },
          { modifier: '', [TRANSFORM_INPUT]: field[TRANSFORM_INPUT] }
        )
      );
    } else if (isMany) {
      ////Modifiers for arrays
      [
        { modifier: 'some', type: lastType },
        { modifier: 'all', type: new GraphQLList(lastType) },
        { modifier: 'exact', type: new GraphQLList(lastType) },
        { modifier: 'in', type: new GraphQLList(lastType) },
        { modifier: 'nin', type: new GraphQLList(lastType) },
      ].forEach(item => {
        let modifier = item.modifier;
        let fieldName = field.name;
        if (modifier != '') {
          fieldName = `${field.name}_${modifier}`;
        }
        fields.push(
          this._wrapTransformInputWhere(
            {
              type: item.type,
              name: fieldName,
            },
            { modifier, [TRANSFORM_INPUT]: field[TRANSFORM_INPUT] }
          )
        );
      });
    } else if (Modifiers[lastType]) {
      ////Modifiers for scalars
      let modifiers = Modifiers[lastType];
      modifiers.forEach(modifier => {
        let fieldName = field.name;
        if (modifier != '') {
          fieldName = `${field.name}_${modifier}`;
        }
        fields.push(
          this._wrapTransformInputWhere(
            {
              type: newFieldType,
              name: fieldName,
            },
            { modifier, [TRANSFORM_INPUT]: field[TRANSFORM_INPUT] }
          )
        );
      });
    }
    return fields;
  };

  _wrapTransformInputObjectWhere = (field, options = {}) => {
    let transformFunc = options[TRANSFORM_INPUT]
      ? options[TRANSFORM_INPUT][INPUT_WHERE]
      : undefined;

    field.mmTransform = async params => {
      if (transformFunc) {
        params = await transformFunc(params);
      }

      let newParams = {};
      let newValue = {};
      let value = params[field.name];
      await asyncForEach(_.values(field.type._fields), async subfield => {
        if (value[subfield.name]) {
          let val = _.pick(value, subfield.name);
          let transformFunc = subfield.mmTransform;
          if (transformFunc) {
            val = await transformFunc(val);
          }
          newValue = { ...newValue, ...val };
        }
      });
      _.keys(newValue).forEach(key => {
        newParams[`${field.name}.${key}`] = newValue[key];
      });
      return newParams;
    };
    return field;
  };

  _wrapTransformInputWhere = (field, options = {}) => {
    let transformFunc = options[TRANSFORM_INPUT]
      ? options[TRANSFORM_INPUT][INPUT_WHERE]
      : undefined;
    field.mmTransform = async params => {
      if (transformFunc) {
        params = await transformFunc(params);
      }
      params = this._transformInputWhere(params, options.modifier);
      return params;
    };
    return field;
  };

  _transformInputWhere = (params, modifier) =>
    _(params)
      .mapValues(value => this._mapModifier(modifier, value))
      .mapKeys((value, key) => {
        if (modifier != '') {
          return key.substring(key.length - modifier.length - 1, 0);
        } else {
          return key;
        }
      })
      .value();

  _mapModifier = (modifier, value) => {
    switch (modifier) {
      case '':
        return value;
      case 'not':
        return { $not: { $eq: value } };
      case 'lt':
      case 'lte':
      case 'gt':
      case 'gte':
        return { [`$${modifier}`]: value };
      case 'in':
      case 'some':
        return { $in: value };
      case 'every':
        return { $all: value };
      case 'none':
      case 'not_in':
        return { $nin: value };
      case 'contains':
        return { $regex: `.*${value}.*` };
      case 'contains':
        return { $regex: `.*${value}.*` };
        break;
      case 'not_contains':
        return { $not: { $regex: `.*${value}.*` } };
      case 'starts_with':
        return { $regex: `.*${value}` };
      case 'not_starts_with':
        return { $not: { $regex: `.*${value}` } };
      case 'ends_with':
        return { $regex: `${value}.*` };
      case 'not_ends_with':
        return { $not: { $regex: `${value}.*` } };
      case 'exists':
        return { $exists: value };
      default:
        return {};
    }
  };

  _type = typeName => {
    if (!this.SchemaTypes[typeName]) throw `Type ${typeName} not found`;
    return this.SchemaTypes[typeName];
  };

  _inputTypeName = (typeName, target) => {
    return `${typeName}${target.charAt(0).toUpperCase() +
      target.slice(1)}Input`;
  };

  _createInputEnum = (name, initialType, target) => {
    let deafultTransformFunc = this._defaultTransformToInput[target];
    let values = [];
    _.values(initialType._fields).forEach(field => {
      let { mmTransformToInput = {} } = field;
      let transformFunc = mmTransformToInput[target] || deafultTransformFunc;
      values = [...values, ...transformFunc(field)];
    });

    let newType = new GraphQLEnumType({
      name,
      values: this._fieldsArrayToObject(values),
    });
    return newType;
  };

  _createInputObject = (name, initialType, target) => {
    let newType = new GraphQLInputObjectType({
      name,
      fields: {},
    });
    newType.getFields();
    newType.mmFill = this._fillInputObject(newType, initialType, target);
    return newType;
  };

  _addAndOr = (fields, type) => {
    let manyType = new GraphQLList(type);
    fields.AND = {
      name: 'AND',
      type: manyType,
      mmTransform: async params => {
        params = await applyInputTransform(params.AND, manyType);
        return { $and: params };
      },
    };
    fields.OR = {
      name: 'OR',
      type: manyType,
      mmTransform: async params => {
        params = await applyInputTransform(params.OR, manyType);
        return { $or: params };
      },
    };
  };

  _fillInputObject = (type, initialType, target) =>
    new Promise((resolve, reject) => {
      process.nextTick(() => {
        let deafultTransformFunc = this._defaultTransformToInput[target];
        let fields = {};
        if (target == INPUT_WHERE) {
          this._addAndOr(fields, type);
        }

        _.values(initialType._fields).forEach(field => {
          let { mmTransformToInput = {} } = field;
          let transformFunc =
            mmTransformToInput[target] || deafultTransformFunc;
          fields = {
            ...fields,
            ...this._fieldsArrayToObject(transformFunc(field)),
          };
        });
        type._fields = fields;
        resolve();
      });
    });

  _fieldsArrayToObject = arr => {
    let res = {};
    arr.forEach(field => {
      res[field.name] = field;
    });
    return res;
  };

  _createInputType = (name, initialType, kind) => {
    let initFunc = this.Kinds[kind];
    if (!initFunc) throw `Unknown kind ${kind}`;
    let newType = initFunc(name, initialType, kind);
    this.SchemaTypes[name] = newType;
    return newType;
  };

  // _createInputType = (name, initialType, king) => {
  //   let newType = null;
  //   switch (target) {
  //     case INPUT_CREATE:
  //     case INPUT_WHERE:
  //     case INPUT_WHERE_UNIQUE:
  //       newType = new GraphQLInputObjectType({
  //         name,
  //         fields: {},
  //       });
  //       newType.getFields();
  //       newType.mmFill = this._fillInputObject(newType, initialType, target);
  //       break;
  //     case INPUT_ORDER_BY:
  //       newType = new GraphQLEnumType({
  //         name,
  //         values: {},
  //       });
  //       newType.mmFill = this._fillInputEnum(newType, initialType, target);
  //       break;
  //     case INPUT_CREATE_CONNECT_ONE:
  //       // newType = new GraphQLInputObjectType({
  //       //   name,
  //       //   fields: {
  //       //     create: {
  //       //       name: 'create',
  //       //       type: this._inputType(initialType, INPUT_CREATE),
  //       //     },
  //       //     connect: {
  //       //       name: 'connect',
  //       //       type: this._inputType(initialType, INPUT_WHERE_UNIQUE),
  //       //     },
  //       //   },
  //       // });
  //       // newType.getFields();
  //       break;
  //   }
  //   this.SchemaTypes[name] = newType;
  //   return newType;
  // };

  _inputType = (type, target) => {
    if (typeof type == String) {
      type = this._type(type);
    }
    let typeName = this._inputTypeName(type.name, target);
    try {
      return this._type(typeName);
    } catch (err) {
      return this._createInputType(typeName, type, target);
    }
  };

  get = this._inputType;
  wrapTransformInputWhere = this._wrapTransformInputWhere;

  registerKind = (kind, init) => {
    if (this.Kinds[kind]) throw `Kind ${kind} already registered`;
    this.Kinds[kind] = init;
  };
}

export function appendTransform(field, type, functions) {
  if (!field[type]) field[type] = {};
  field[type] = { ...field[type], ...functions };
}

export async function applyInputTransform(params, type) {
  if (hasQLListType(type)) {
    let lastType = getLastType(type);
    return await Promise.all(
      params.map(val => applyInputTransform(val, lastType))
    );
  }

  let fields = type._fields;
  let result = {};
  await asyncForEach(_.keys(params), async key => {
    let field = fields[key];
    let value = params[key];
    if (field && field.mmTransform) {
      result = {
        ...result,
        ...(await field.mmTransform({
          [key]: value,
        })),
      };
    } else if (getLastType(field.type)._fields) {
      result = {
        ...result,
        ...{
          [key]: await applyInputTransform(value, field.type),
        },
      };
    }
  });
  return result;
}
