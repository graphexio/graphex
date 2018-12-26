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
  addResolveMapFilterToSelector,
} from './utils';

const Modifiers = {
  Boolean: ['', 'not', 'exists'],
  ID: ['', 'in', 'not_in', 'exists'],
  ObjectID: ['', 'in', 'not_in', 'exists'],
  Int: ['', 'in', 'not_in', 'lt', 'lte', 'gt', 'gte', 'exists'],
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
  GeoJSONPoint: ['near'],
};

export default class InputTypes {
  constructor({ SchemaTypes }) {
    this.SchemaTypes = SchemaTypes;

    this._defaultTransformToInput = {
      orderBy: this._defaultTransformToInputOrderBy,
      where: this._defaultTransformToInputWhere,
      create: this._defaultTransformToInputCreate,
    };
  }

  _defaultTransformToInputOrderBy = field => [
    {
      name: `${field.name}_ASC`,
      isDeprecated: false,
      value: { [field.name]: 1 },
    },
    {
      name: `${field.name}_DESC`,
      isDeprecated: false,
      value: { [field.name]: -1 },
    },
  ];

  _defaultTransformToInputCreate = field => {
    let lastType = getLastType(field.type);
    let newFieldType = lastType;
    if (lastType instanceof GraphQLObjectType) {
      newFieldType = this._inputType(field.type, 'create');
    }
    return {
      [field.name]: {
        ...field,
        type: cloneSchema(field.type, newFieldType),
        name: field.name,
      },
    };
  };

  _defaultTransformToInputWhere = field => {
    let lastType = getLastType(field.type);
    let isMany = hasQLListType(field.type);
    let newFieldType = lastType;

    let fields = {};
    if (lastType instanceof GraphQLObjectType) {
      ////Modifiers for embedded objects
      let fieldName = field.name;
      fields[fieldName] = this._wrapTransformInput(
        {
          type: this._inputType(lastType, 'where'),
          name: fieldName,
        },
        'where',
        { modifier: '' }
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
        fields[fieldName] = this._wrapTransformInput(
          {
            type: item.type,
            name: fieldName,
          },
          'where',
          { modifier }
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
        fields[fieldName] = this._wrapTransformInput(
          {
            type: newFieldType,
            name: fieldName,
          },
          'where',
          { modifier }
        );
      });
    }
    return fields;
  };

  _wrapTransformInput = (field, target, options) => {
    const { mmTransformInput = {} } = field;
    let transformFunc = mmTransformInput[target];
    field.mmTransform = async params => {
      if (transformFunc) {
        params = await transformFunc(params);
      }
      switch (target) {
        case 'where':
          return this._transformInputWhere(params, options.modifier);
        default:
          return params;
      }
    };
    return field;
  };

  _transformInputWhere = (params, modifier) =>
    _.mapValues(params, value => this._mapModifier(modifier, value));

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
      case 'near':
        return {
          $near: {
            $geometry: value.geometry,
            $minDistance: value.minDistance,
            $maxDistance: value.maxDistance,
          },
        };
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

  _fillInputType = async (type, initialType, target) => {
    let deafultTransformFunc = this._defaultTransformToInput[target];
    switch (target) {
      case 'orderBy': {
        let values = [];
        _.values(initialType._fields).forEach(field => {
          let { mmTransformToInput = {} } = field;
          let transformFunc =
            mmTransformToInput[target] || deafultTransformFunc;
          values = [...values, ...transformFunc(field)];
        });
        type._values = values;
        break;
      }
      case 'create':
      case 'where': {
        let fields = {};
        _.values(initialType._fields).forEach(field => {
          let { mmTransformToInput = {} } = field;
          let transformFunc =
            mmTransformToInput[target] || deafultTransformFunc;
          fields = { ...fields, ...transformFunc(field) };
        });
        type._fields = fields;
        break;
      }
    }
  };

  _createInputType = (name, initialType, target) => {
    let newType = null;
    switch (target) {
      case 'create':
      case 'where':
        newType = new GraphQLInputObjectType({
          name,
          fields: {},
        });
        newType.getFields();
        break;
      case 'orderBy':
        newType = new GraphQLEnumType({
          name,
          values: {},
        });
        break;
    }
    this.SchemaTypes[name] = newType;
    newType.mmFill = this._fillInputType(newType, initialType, target);
    return newType;
  };

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
}
