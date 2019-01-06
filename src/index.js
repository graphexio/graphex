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

import InitialScheme from './initialScheme';
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
import Scalars, { typeDefs as ScalarsSchemes } from './scalars';
import * as GeoJSONModule from './geoJSON';

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
    this.Modules = [GeoJSONModule];
    this.TypesInit = {};
    this.FieldsInit = {};
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

  _onTypeInit = type => {
    let init = this.TypesInit[type.name];
    if (init) {
      init(type);
    }
  };

  _onFieldsInit = type => {
    _.values(type._fields).forEach(field => {
      let lastType = getLastType(field.type);
      let init = this.FieldsInit[lastType.name];
      if (init) {
        init(field, { types: this.SchemaTypes });
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
      InitialScheme,
      ReadOnlyScheme,
      ModelScheme,
      DirectiveDBScheme,
      RelationScheme,
      IDScheme,
      UniqueScheme,
      // GeoJSONScheme,
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
      // ...GeoJSON,
      ...Scalars,
    };

    let modelParams = {
      ...params,
      typeDefs,
      schemaDirectives,
      directiveResolvers,
      resolvers,
    };

    this.Modules.forEach(module => {
      if (module.typeDef) typeDefs.push(module.typeDef);
      if (module.resolvers) resolvers = _.merge(resolvers, module.resolvers);
      if (module.typesInit)
        this.TypesInit = _.merge(this.TypesInit, module.typesInit);
      if (module.fieldsInit)
        this.FieldsInit = _.merge(this.FieldsInit, module.fieldsInit);
    });

    let schema = makeExecutableSchema(modelParams);
    // console.warn('before');
    // console.log(schema);
    // schema = mergeSchemas({
    //   schemas: [schema],
    // });
    schema = _.merge(
      schema,
      _.pick(GeoJSONModule, ['_directives', '_typeMap'])
    );
    // console.warn('after');
    // console.log(schema);

    let { _typeMap: SchemaTypes } = schema;
    let { Query, Mutation } = SchemaTypes;

    this.InputTypes = new InputTypes({ SchemaTypes });

    this.SchemaTypes = SchemaTypes;
    this.Query = Query;
    this.Mutation = Mutation;

    _.values(SchemaTypes).forEach(type => {
      this._onTypeInit(type);
    });

    _.values(SchemaTypes).forEach(type => {
      this._onFieldsInit(type);
    });

    _.values(SchemaTypes).forEach(type => {
      this._onSchemaInit(type);

      if (getDirective(type, 'model')) {
        this._createAllQuery(type);
        this._createSingleQuery(type);
        this._createMetaQuery(type);

        this._createCreateMutation(type);
        this._createDeleteMutation(type);
        this._createUpdateMutation(type);
      }
    });

    await Promise.all(
      _.values(SchemaTypes)
        .filter(item => item.mmFill)
        .map(item => item.mmFill)
    );

    return schema;
  };
}
