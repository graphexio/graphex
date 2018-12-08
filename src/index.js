import { makeExecutableSchema } from 'graphql-tools';
import gql from 'graphql-tag';
import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLBoolean,
} from 'graphql';
import _ from 'lodash';
import pluralize from 'pluralize';
export { default as QueryExecutor } from './queryExecutor.js';

import {
  FIND,
  FIND_ONE,
  DISTINCT,
  COUNT,
  INSERT,
  REMOVE,
  UPDATE,
  getInputType,
  getLastType,
  getDirective,
  getDirectiveArg,
  getRelationFieldName,
  hasQLListType,
  mapFiltersToSelector,
  allQueryArgs,
  hasQLNonNullType,
  cloneSchema,
  combineResolvers,
} from './utils';

export {
  FIND,
  FIND_ONE,
  DISTINCT,
  COUNT,
  INSERT,
  REMOVE,
  UPDATE,
  getInputType,
  getLastType,
  getDirective,
  getDirectiveArg,
  getRelationFieldName,
  hasQLListType,
  mapFiltersToSelector,
  allQueryArgs,
  hasQLNonNullType,
  cloneSchema,
  combineResolvers,
} from './utils';

import Relation, { RelationScheme } from './relation';
import RenameDB, { RenameDBScheme, RenameDBResolver } from './renameDB';
import Model, { ModelScheme } from './model';
import ReadOnly, { ReadOnlyScheme } from './readOnly';
import Unique, { UniqueScheme } from './unique';
import GeoJSON, { typeDef as GeoJSONScheme } from './geoJSON';
import Scalars, { typeDefs as ScalarsSchemes } from './scalars';

const relationFieldDefault = '_id';

const Modifiers = {
  Boolean: ['', 'not', 'exists'],
  ID: ['', 'in', 'not_in', 'exists'],
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

export default (params, { queryExecutor }) => {
  let {
    schemaDirectives = {},
    directiveResolvers = {},
    resolvers = {},
    typeDefs = [],
  } = params;
  if (!_.isArray(typeDefs)) typeDefs = [typeDefs];

  typeDefs = [
    ReadOnlyScheme,
    ModelScheme,
    RenameDBScheme,
    RelationScheme,
    UniqueScheme,
    GeoJSONScheme,
    ...ScalarsSchemes,
    ...typeDefs,
  ];

  schemaDirectives = {
    ...schemaDirectives,
    relation: Relation(queryExecutor),
    renameDB: RenameDB,
    model: Model,
    readOnly: ReadOnly,
    unique: Unique,
  };

  directiveResolvers = {
    ...directiveResolvers,
    renameDB: RenameDBResolver,
  };

  resolvers = {
    ...resolvers,
    ...GeoJSON,
    ...Scalars,
  };

  let modelParams = {
    ...params,
    typeDefs,
    schemaDirectives,
    directiveResolvers,
    resolvers,
  };

  let schema = makeExecutableSchema(modelParams);

  let { _typeMap: SchemaTypes } = schema;
  let { Query, Mutation, _QueryMeta } = SchemaTypes;

  _.keys(SchemaTypes).forEach(key => {
    let modelType = SchemaTypes[key];
    if (getDirective(modelType, 'model')) {
      let filterType = createFilterType(modelType, SchemaTypes);
      let orderByType = createOrderByType(modelType, SchemaTypes);
      createAllQuery(modelType, Query, {
        filterType,
        orderByType,
      });
      createMetaQuery(modelType, Query, {
        filterType,
        orderByType,
        _QueryMeta,
      });
      createSingleQuery(modelType, Query);
      createCreateMutation(modelType, { Mutation, SchemaTypes });
      createDeleteMutator(modelType, { Mutation, SchemaTypes });
      createUpdateMutator(modelType, { Mutation, SchemaTypes });
    }
  });

  function createFilterType(modelType, SchemaTypes) {
    let delayedCreateTypes = [];
    const name = `${modelType.name}Filter`;
    if (SchemaTypes[name] && _.keys(SchemaTypes[name]._fields).length > 0) {
      return SchemaTypes[name];
    }

    let fields = {};
    _.keys(modelType._fields).forEach(key => {
      let field = modelType._fields[key];
      if (field.skipFilter) {
        return;
      }

      let type = getLastType(field.type);
      let isMany = hasQLListType(field.type);

      let modifiers = Modifiers[type.name] || [];
      field = _.omit(field, 'resolve');
      field.type = type;

      const { resolveMapFilterToSelector } = field;

      if (type.name == 'GeoJSONPoint') {
        let filterType = getInputType(`GeoJSONPointNearInput`, SchemaTypes);
        field = {
          ...field,
          type: filterType,
        };
      } else if (type instanceof GraphQLObjectType) {
        let filterType = getInputType(`${type.name}Filter`, SchemaTypes);
        delayedCreateTypes.push(type);
        field = {
          ...field,
          type: filterType,
        };
        if (!getDirective(field, 'relation')) {
          field.resolveMapFilterToSelector = async params => {
            if (resolveMapFilterToSelector) {
              params = await resolveMapFilterToSelector(params);
            }
            return _.flatten(
              Promise.all(
                params.map(async ({ fieldName = key, value }) => {
                  let mapSelector = await mapFiltersToSelector(
                    value,
                    filterType._fields
                  );
                  return _.keys(mapSelector).map(selectorKey => ({
                    fieldName: [`${fieldName}.${selectorKey}`],
                    value: mapSelector[selectorKey],
                  }));
                })
              )
            );
          };
        }
        if (isMany) {
          modifiers = ['some', 'every', 'none'];
        } else {
          modifiers = [''];
        }
      }

      //////

      modifiers.forEach(modifier => {
        let fieldName = key;
        if (modifier != '') {
          fieldName = `${key}_${modifier}`;
        }
        let fieldType = field.type;
        if (modifier == 'in' || modifier == 'not_in') {
          fieldType = new GraphQLList(new GraphQLNonNull(field.type));
        } else if (modifier == 'exists') {
          fieldType = GraphQLBoolean;
        }
        fields[fieldName] = AddResolveMapFilterToSelector(
          {
            ...field,
            type: fieldType,
            name: fieldName,
          },
          key,
          modifier
        );
      });
    });

    let filterType = getInputType(name, SchemaTypes);
    if (name != 'GeoJSONPointNearFilter') {
      ['AND', 'OR'].forEach(modifier => {
        fields[modifier] = {
          type: new GraphQLList(new GraphQLNonNull(filterType)),
          args: [],
          name: modifier,
          resolveMapFilterToSelector: async params => {
            return params.map(param => ({
              fieldName: `$${modifier.toLowerCase()}`,
              value: Promise.all(
                param.value.map(
                  async val =>
                    await mapFiltersToSelector(val, filterType._fields)
                )
              ),
            }));
          },
        };
      });
    }
    filterType._fields = fields;
    SchemaTypes[name] = filterType;
    delayedCreateTypes.forEach(type => {
      createFilterType(type, SchemaTypes);
    });
    return filterType;
  }

  function AddResolveMapFilterToSelector(field, defaultName, modifier) {
    const { resolveMapFilterToSelector } = field;
    field.resolveMapFilterToSelector = async function(params) {
      if (resolveMapFilterToSelector) {
        params = await resolveMapFilterToSelector(params);
      }
      return params.map(({ fieldName = defaultName, value }) => {
        return {
          fieldName,
          value: mapModifier(modifier, value),
        };
      });
    };
    return field;
  }

  function createOrderByType(modelType, SchemaTypes) {
    const name = `${modelType.name}OrderBy`;
    let values = {};
    let i = 0;
    _.keys(modelType._fields).forEach(key => {
      values[`${key}_ASC`] = { value: { [key]: 1 } };
      values[`${key}_DESC`] = { value: { [key]: -1 } };
      i += 2;
    });
    return (SchemaTypes[name] = new GraphQLEnumType({
      name,
      values,
    }));
  }

  function mapModifier(modifier, value) {
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
  }

  function createAllQuery(modelType, Query, { filterType, orderByType }) {
    const name = `all${pluralize(modelType.name)}`;
    Query._fields[name] = {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(modelType))),
      description: undefined,
      args: allQueryArgs({ filterType, orderByType }),
      deprecationReason: undefined,
      isDeprecated: false,
      name,
      resolve: async (parent, args, context, info) => {
        return queryExecutor({
          type: FIND,
          collection: modelType.name,
          selector: await mapFiltersToSelector(args.where, filterType._fields),
          options: { skip: args.skip, limit: args.first, sort: args.orderBy },
          context,
        });
      },
    };
  }

  function createMetaQuery(
    modelType,
    Query,
    { filterType, orderByType, _QueryMeta }
  ) {
    const name = `_all${pluralize(modelType.name)}Meta`;
    Query._fields[name] = {
      type: _QueryMeta,
      description: undefined,
      args: allQueryArgs({ filterType, orderByType }),
      deprecationReason: undefined,
      isDeprecated: false,
      name,
      resolve: async (parent, args, context, info) => {
        return {
          count: queryExecutor({
            type: COUNT,
            collection: modelType.name,
            selector: await mapFiltersToSelector(
              args.where,
              filterType._fields
            ),
            options: { skip: args.skip, limit: args.first },
            context,
          }),
        };
      },
    };
  }

  function createSingleQuery(modelType, Query) {
    let uniqueFields = _.values(modelType._fields).filter(field =>
      getDirective(field, 'unique')
    );
    if (uniqueFields.length > 0) {
      let argsObj = {};
      let argsArr = uniqueFields.map(field => {
        let newArg = _.omit(field, 'resolve');
        // {
        //   name: field.name,
        //   description: null,
        //   type: field.type,
        //   defaultValue: undefined
        //
        // };
        argsObj[field.name] = newArg;
        return newArg;
      });

      const name = modelType.name;
      Query._fields[name] = {
        type: modelType,
        description: undefined,
        args: argsArr,
        deprecationReason: undefined,
        isDeprecated: false,
        name,
        resolve: async (parent, args, context, info) => {
          return queryExecutor({
            type: FIND_ONE,
            collection: modelType.name,
            selector: await mapFiltersToSelector(args, argsObj),
            options: {},
            context,
          });
        },
      };
    }
  }

  function createInputType(type, SchemaTypes) {
    let delayedCreateTypes = [];

    let name = `${type.name}Input`;
    if (SchemaTypes[name] && !_.isEmpty(_.keys(SchemaTypes[name]._fields)))
      return SchemaTypes[name];

    let inputType = getInputType(`${type.name}Input`, SchemaTypes);
    _.values(type._fields).forEach(field => {
      if (field.skipCreate) return;
      let newField = _.omit(field, 'resolve');
      let newFieldType = newField.type;
      let lastType = getLastType(newFieldType);
      if (lastType instanceof GraphQLObjectType) {
        delayedCreateTypes.push(lastType);
        lastType = getInputType(`${lastType.name}Input`, SchemaTypes);
        newField.type = cloneSchema(newFieldType, lastType);
      }
      inputType._fields[field.name] = newField;
    });

    SchemaTypes[name] = inputType;

    delayedCreateTypes.forEach(type => {
      createInputType(type, SchemaTypes);
    });
    return inputType;
  }

  function createCreateMutation(modelType, { Mutation, SchemaTypes }) {
    let argFields = _.values(modelType._fields).filter(
      field => !field.skipCreate && !field.primaryKey
    );

    let argsObj = {};
    let argsArr = argFields.map(field => {
      let newArg = _.omit(field, 'resolve');
      let type = newArg.type;
      let lastType = getLastType(type);
      if (lastType instanceof GraphQLObjectType) {
        type = cloneSchema(type, createInputType(lastType, SchemaTypes));
      }
      newArg.type = type;

      argsObj[field.name] = newArg;
      return newArg;
    });

    const name = `create${modelType.name}`;
    Mutation._fields[name] = {
      type: modelType,
      args: argsArr,
      isDeprecated: false,
      name,
      resolve: (parent, args, context, info) => {
        return queryExecutor({
          type: INSERT,
          collection: modelType.name,
          doc: args,
          options: {},
          context,
        });
      },
    };
  }

  function createDeleteMutator(modelType, { Mutation, SchemaTypes }) {
    let argFields = _.values(modelType._fields).filter(
      field => field.primaryKey
    );

    let argsObj = {};
    let argsArr = argFields.map(field => {
      let newArg = _.omit(field, 'resolve');
      let type = newArg.type;
      let lastType = getLastType(type);
      if (lastType instanceof GraphQLObjectType) {
        type = cloneSchema(type, createInputType(lastType, SchemaTypes));
      }
      newArg.type = type;

      argsObj[field.name] = newArg;
      return newArg;
    });

    const name = `delete${modelType.name}`;
    Mutation._fields[name] = {
      type: modelType,
      args: argsArr,
      isDeprecated: false,
      name,
      resolve: async (parent, args, context, info) => {
        return queryExecutor({
          type: REMOVE,
          collection: modelType.name,
          selector: await mapFiltersToSelector(args, argsObj),
          options: {},
          context,
        });
      },
    };
  }

  function createUpdateMutator(modelType, { Mutation, SchemaTypes }) {
    let argFields = _.values(modelType._fields).filter(
      field => !field.skipCreate || field.primaryKey
    );
    let primaryKey;
    let argsObj = {};
    let argsArr = argFields.map(field => {
      if (field.primaryKey) primaryKey = field.name;
      let newArg = _.omit(field, 'resolve');
      let type = newArg.type;
      let lastType = getLastType(type);
      if (lastType instanceof GraphQLObjectType) {
        type = cloneSchema(type, createInputType(lastType, SchemaTypes));
      }
      newArg.type = type;

      argsObj[field.name] = newArg;
      return newArg;
    });

    const name = `update${modelType.name}`;
    Mutation._fields[name] = {
      type: modelType,
      args: argsArr,
      isDeprecated: false,
      name,
      resolve: async (parent, args, context, info) => {
        return queryExecutor({
          type: UPDATE,
          collection: modelType.name,
          selector: await mapFiltersToSelector(
            _.pick(args, primaryKey),
            argsObj
          ),
          doc: _.omit(args, primaryKey),
          options: {},
          context,
        });
      },
    };
  }

  return schema;
};
