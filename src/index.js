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

export { default as QueryExecutor } from './queryExecutor';
import {
  FIND,
  FIND_ONE,
  DISTINCT,
  COUNT,
  INSERT_ONE,
  DELETE_ONE,
  UPDATE_ONE,
  UPDATE_MANY,
} from './queryExecutor';

import {
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
  addResolveMapFilterToSelector,
} from './utils';

export {
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

import Relation, { RelationScheme } from './directives/relation';
import ExtRelation, { ExtRelationScheme } from './directives/extRelation';
import DirectiveDB, {
  DirectiveDBScheme,
  DirectiveDBResolver,
} from './directives/db';
import Model, { ModelScheme } from './directives/model';
import ReadOnly, { ReadOnlyScheme } from './directives/readOnly';
import Unique, { UniqueScheme } from './directives/unique';
import ID, { IDScheme } from './directives/id';
import GeoJSON, { typeDef as GeoJSONScheme } from './geoJSON';
import Scalars, { typeDefs as ScalarsSchemes } from './scalars';

import InputTypes, {
  INPUT_CREATE,
  INPUT_WHERE,
  INPUT_WHERE_UNIQUE,
  INPUT_ORDER_BY,
  INPUT_UPDATE,
  applyInputTransform,
} from './inputTypes';

const relationFieldDefault = '_id';

export default class ModelMongo {
  constructor({ queryExecutor }) {
    this.QueryExecutor = queryExecutor;
  }

  _inputType = (type, target) => {
    return this.InputTypes.get(type, target);
  };

  _createAllQuery = modelType => {
    let whereType = this._inputType(modelType, INPUT_WHERE);
    let orderByType = this._inputType(modelType, INPUT_ORDER_BY);

    const name = pluralize(modelType.name).toLowerCase();
    this.Query._fields[name] = {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(modelType))),
      description: undefined,
      args: allQueryArgs({ whereType, orderByType }),
      deprecationReason: undefined,
      isDeprecated: false,
      name,
      resolve: async (parent, args, context, info) => {
        return this.QueryExecutor({
          type: FIND,
          collection: modelType.name,
          selector: await applyInputTransform(args.where, whereType),
          options: { skip: args.skip, limit: args.first, sort: args.orderBy },
          context,
        });
      },
    };
  };

  _createMetaQuery = modelType => {
    let whereType = this._inputType(modelType, INPUT_WHERE);
    let orderByType = this._inputType(modelType, INPUT_ORDER_BY);

    const name = `_${pluralize(modelType.name).toLowerCase()}Meta`;
    this.Query._fields[name] = {
      type: this.SchemaTypes._QueryMeta,
      description: undefined,
      args: allQueryArgs({ whereType, orderByType }),
      deprecationReason: undefined,
      isDeprecated: false,
      name,
      resolve: async (parent, args, context, info) => {
        return {
          count: this.QueryExecutor({
            type: COUNT,
            collection: modelType.name,
            selector: applyInputTransform(args.where, whereType),
            options: { skip: args.skip, limit: args.first },
            context,
          }),
        };
      },
    };
  };

  _createSingleQuery = (modelType, Query) => {
    let orderByType = this._inputType(modelType, INPUT_ORDER_BY);
    let whereUniqueType = this._inputType(modelType, INPUT_WHERE_UNIQUE);

    let args = [
      {
        name: 'where',
        type: whereUniqueType,
      },
    ];

    const name = modelType.name.toLowerCase();
    this.Query._fields[name] = {
      type: modelType,
      description: undefined,
      args,
      deprecationReason: undefined,
      isDeprecated: false,
      name,
      resolve: async (parent, args, context, info) => {
        return this.QueryExecutor({
          type: FIND_ONE,
          collection: modelType.name,
          selector: await applyInputTransform(args.where, whereUniqueType),
          options: {},
          context,
        });
      },
    };
  };

  _createCreateMutation = modelType => {
    let whereType = this._inputType(modelType, INPUT_WHERE);
    let orderByType = this._inputType(modelType, INPUT_ORDER_BY);
    let inputType = this._inputType(modelType, INPUT_CREATE);

    let args = [
      {
        type: new GraphQLNonNull(inputType),
        name: 'data',
      },
    ];

    const name = `create${modelType.name}`;
    this.Mutation._fields[name] = {
      type: modelType,
      args: args,
      isDeprecated: false,
      name,
      resolve: async (parent, args, context, info) => {
        return this.QueryExecutor({
          type: INSERT_ONE,
          collection: modelType.name,
          doc: await applyInputTransform(args.data, inputType),
          options: {},
          context,
        });
      },
    };
  };

  _createDeleteMutation = modelType => {
    let inputType = this._inputType(modelType, INPUT_WHERE_UNIQUE);
    let args = [
      {
        type: new GraphQLNonNull(inputType),
        name: 'where',
      },
    ];

    const name = `delete${modelType.name}`;
    this.Mutation._fields[name] = {
      type: modelType,
      args,
      isDeprecated: false,
      name,
      resolve: async (parent, args, context, info) => {
        return this.QueryExecutor({
          type: DELETE_ONE,
          collection: modelType.name,
          selector: await applyInputTransform(args.where, inputType),
          options: {},
          context,
        });
      },
    };
  };

  _createUpdateMutation = modelType => {
    let whereType = this._inputType(modelType, INPUT_WHERE_UNIQUE);
    let updateType = this._inputType(modelType, INPUT_UPDATE);
    let args = [
      {
        type: new GraphQLNonNull(updateType),
        name: 'data',
      },
      {
        type: new GraphQLNonNull(whereType),
        name: 'where',
      },
    ];

    const name = `update${modelType.name}`;
    this.Mutation._fields[name] = {
      type: modelType,
      args,
      isDeprecated: false,
      name,
      resolve: async (parent, args, context, info) => {
        return this.QueryExecutor({
          type: UPDATE_ONE,
          collection: modelType.name,
          selector: await applyInputTransform(args.where, whereType),
          doc: await applyInputTransform(args.data, updateType),
          options: {},
          context,
        });
      },
    };
  };

  _onSchemaInit = type => {
    _.values(type._fields).forEach(field => {
      if (field.mmOnSchemaInit) {
        field.mmOnSchemaInit(field);
      }
    });
  };

  makeExecutablSchema = async params => {
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
      DirectiveDBScheme,
      RelationScheme,
      IDScheme,
      UniqueScheme,
      GeoJSONScheme,
      ExtRelationScheme,
      ...ScalarsSchemes,
      ...typeDefs,
    ];

    schemaDirectives = {
      ...schemaDirectives,
      relation: Relation(this.QueryExecutor),
      extRelation: ExtRelation(this.QueryExecutor),
      db: DirectiveDB,
      model: Model,
      readOnly: ReadOnly,
      unique: Unique,
      id: ID,
    };

    directiveResolvers = {
      ...directiveResolvers,
      db: DirectiveDBResolver,
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
    let { Query, Mutation } = SchemaTypes;

    this.InputTypes = new InputTypes({ SchemaTypes });

    this.SchemaTypes = SchemaTypes;
    this.Query = Query;
    this.Mutation = Mutation;

    _.keys(SchemaTypes).forEach(key => {
      let modelType = SchemaTypes[key];
      this._onSchemaInit(modelType);

      if (getDirective(modelType, 'model')) {
        this._createAllQuery(modelType);
        this._createSingleQuery(modelType);
        this._createMetaQuery(modelType);

        this._createCreateMutation(modelType);
        this._createDeleteMutation(modelType);
        this._createUpdateMutation(modelType);
      }
    });

    // function createWhereInputType(modelType, SchemaTypes) {
    //   let delayedCreateTypes = [];
    //   const name = getInputTypeName(modelType.name, 'where');
    //   if (SchemaTypes[name] && _.keys(SchemaTypes[name]._fields).length > 0) {
    //     return SchemaTypes[name];
    //   }
    //
    //   let fields = {};
    //   _.keys(modelType._fields).forEach(key => {
    //     let field = modelType._fields[key];
    //     if (field.skipFilter) {
    //       return;
    //     }
    //
    //     let type = getLastType(field.type);
    //     let isMany = hasQLListType(field.type);
    //
    //     let modifiers = Modifiers[type.name] || [];
    //     field = _.omit(field, 'resolve');
    //     field.type = type;
    //
    //     const { resolveMapFilterToSelector } = field;
    //
    //     if (type.name == 'GeoJSONPoint') {
    //       let whereType = getInputType(`GeoJSONPointNearInput`, SchemaTypes);
    //       field = {
    //         ...field,
    //         type: whereType,
    //       };
    //     } else if (type instanceof GraphQLObjectType) {
    //       let whereType = getInputType(name, SchemaTypes);
    //       delayedCreateTypes.push(type);
    //       field = {
    //         ...field,
    //         type: whereType,
    //       };
    //       if (!getDirective(field, 'relation')) {
    //         field.resolveMapFilterToSelector = async params => {
    //           if (resolveMapFilterToSelector) {
    //             params = await resolveMapFilterToSelector(params);
    //           }
    //           return _.flatten(
    //             Promise.all(
    //               params.map(async ({ fieldName = key, value }) => {
    //                 let mapSelector = await mapFiltersToSelector(
    //                   value,
    //                   whereType._fields
    //                 );
    //                 return _.keys(mapSelector).map(selectorKey => ({
    //                   fieldName: [`${fieldName}.${selectorKey}`],
    //                   value: mapSelector[selectorKey],
    //                 }));
    //               })
    //             )
    //           );
    //         };
    //       }
    //       if (isMany) {
    //         modifiers = ['some', 'every', 'none'];
    //       } else {
    //         modifiers = [''];
    //       }
    //     }
    //
    //     //////
    //
    //     modifiers.forEach(modifier => {
    //       let fieldName = key;
    //       if (modifier != '') {
    //         fieldName = `${key}_${modifier}`;
    //       }
    //       let fieldType = field.type;
    //       if (modifier == 'in' || modifier == 'not_in') {
    //         fieldType = new GraphQLList(new GraphQLNonNull(field.type));
    //       } else if (modifier == 'exists') {
    //         fieldType = GraphQLBoolean;
    //       }
    //       fields[fieldName] = addResolveMapFilterToSelector(
    //         {
    //           ...field,
    //           type: fieldType,
    //           name: fieldName,
    //         },
    //         key,
    //         modifier
    //       );
    //     });
    //   });
    //
    //   let whereType = getInputType(name, SchemaTypes);
    //   if (name != 'GeoJSONPointNearFilter') {
    //     ['AND', 'OR'].forEach(modifier => {
    //       fields[modifier] = {
    //         type: new GraphQLList(new GraphQLNonNull(whereType)),
    //         args: [],
    //         name: modifier,
    //         resolveMapFilterToSelector: async params => {
    //           return params.map(param => ({
    //             fieldName: `$${modifier.toLowerCase()}`,
    //             value: Promise.all(
    //               param.value.map(
    //                 async val =>
    //                   await mapFiltersToSelector(val, whereType._fields)
    //               )
    //             ),
    //           }));
    //         },
    //       };
    //     });
    //   }
    //   whereType._fields = fields;
    //   SchemaTypes[name] = whereType;
    //   delayedCreateTypes.forEach(type => {
    //     createWhereInputType(type, SchemaTypes);
    //   });
    //   return whereType;
    // }

    // function createOrderByType(modelType, SchemaTypes) {
    //   const name = getInputTypeName(modelType.name, 'orderBy');
    //   let values = {};
    //   let i = 0;
    //   _.keys(modelType._fields).forEach(key => {
    //     values[`${key}_ASC`] = { value: { [key]: 1 } };
    //     values[`${key}_DESC`] = { value: { [key]: -1 } };
    //     i += 2;
    //   });
    //   return (SchemaTypes[name] = new GraphQLEnumType({
    //     name,
    //     values,
    //   }));
    // }

    await Promise.all(
      _.values(SchemaTypes)
        .filter(item => item.mmFill)
        .map(item => item.mmFill)
    );

    return schema;
  };
}
