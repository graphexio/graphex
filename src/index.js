import { makeExecutableSchema as makeGraphQLSchema } from 'graphql-tools';
import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
} from 'graphql';
import _ from 'lodash';
import pluralize from 'pluralize';
import {
  COUNT,
  DELETE_ONE,
  FIND,
  FIND_ONE,
  INSERT_ONE,
  UPDATE_ONE,
} from './queryExecutor';

import {
  allQueryArgs,
  cloneSchema,
  combineResolvers,
  getDirective,
  getDirectiveArg,
  getLastType,
  getRelationFieldName,
  hasQLListType,
  hasQLNonNullType,
  lowercaseFirstLetter,
  prepareUpdateDoc,
} from './utils';
import TypeWrap from './typeWrap';

import InitialScheme from './initialScheme';

import Abstract, { AbstractScheme } from './directives/abstract';
import Inherit, { InheritScheme } from './directives/inherit';
import Relation, { RelationScheme } from './directives/relation';
import ExtRelation, { ExtRelationScheme } from './directives/extRelation';
import DirectiveDB, {
  DirectiveDBResolver,
  DirectiveDBScheme,
} from './directives/db';
import Model, { ModelScheme } from './directives/model';
import Unique, { UniqueScheme } from './directives/unique';
import ID, { IDScheme } from './directives/id';
import Scalars, { typeDefs as ScalarsSchemes } from './scalars';
import Modules from './modules';

import InputTypes from './inputTypes';
import { applyInputTransform } from './inputTypes/utils';
import * as KIND from './inputTypes/kinds';

export { default as QueryExecutor } from './queryExecutor';

export {
  getLastType,
  getDirective,
  getDirectiveArg,
  getRelationFieldName,
  hasQLListType,
  allQueryArgs,
  hasQLNonNullType,
  cloneSchema,
  combineResolvers,
} from './utils';

export default class ModelMongo {
  constructor({ queryExecutor, options = {} }) {
    this.QueryExecutor = queryExecutor;
    this.Modules = Modules;
    this.TypesInit = {};
    this.FieldsInit = {};
    this.options = options;
  }

  _inputType = (type, target) => {
    return InputTypes.get(type, target);
  };

  _createAllQuery = modelType => {
    let typeWrap = new TypeWrap(modelType);
    let whereType, orderByType;
    try {
      whereType = this._inputType(modelType, KIND.WHERE);
      orderByType = this._inputType(modelType, KIND.ORDER_BY);
    } catch (e) {
      return;
    }

    const name = lowercaseFirstLetter(pluralize(modelType.name));
    this.Query._fields[name] = {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(modelType))),
      args: allQueryArgs({ whereType, orderByType }),
      isDeprecated: false,
      name,
      resolve: async (parent, args, context) => {
        let selector = await applyInputTransform({ parent, context })(
          args.where,
          whereType
        );
        if (typeWrap.isInherited()) {
          selector[
            typeWrap.interfaceType().mmDiscriminatorField
          ] = typeWrap.realType().mmDiscriminator;
        }
        return this.QueryExecutor({
          type: FIND,
          modelType,
          collection: modelType.mmCollectionName,
          selector,
          options: { skip: args.skip, limit: args.first, sort: args.orderBy },
          context,
        });
      },
    };
  };

  _createAggregateAndConnectionTypes = modelType => {
    let typeWrap = new TypeWrap(modelType);

    const aggregateTypeName = `Aggregate${modelType.name}`;
    this.SchemaTypes[aggregateTypeName] = new GraphQLObjectType({
      name: aggregateTypeName,
      fields: {
        count: {
          name: 'count',
          type: new GraphQLNonNull(GraphQLInt),
          resolve: async (parent, args, context) => {
            let selector = parent._selector;
            if (typeWrap.isInherited()) {
              selector[
                typeWrap.interfaceType().mmDiscriminatorField
              ] = typeWrap.realType().mmDiscriminator;
            }

            return this.QueryExecutor({
              type: COUNT,
              collection: modelType.mmCollectionName,
              selector,
              options: {
                skip: parent._skip,
                limit: parent._limit,
              },
              context,
            });
          },
        },
      },
    });

    const connectionTypeName = `${modelType.name}Connection`;
    this.SchemaTypes[connectionTypeName] = new GraphQLObjectType({
      name: connectionTypeName,
      fields: {
        aggregate: {
          name: 'aggregate',
          type: new GraphQLNonNull(this.SchemaTypes[aggregateTypeName]),
          resolve: async parent => {
            return parent;
          },
        },
      },
    });
  };

  _createConnectionQuery = modelType => {
    let whereType, orderByType;
    try {
      whereType = this._inputType(modelType, KIND.WHERE);
      orderByType = this._inputType(modelType, KIND.ORDER_BY);
    } catch (e) {
      return;
    }

    const connectionTypeName = `${modelType.name}Connection`;
    const name = `${lowercaseFirstLetter(pluralize(modelType.name))}Connection`;
    this.Query._fields[name] = {
      type: this.SchemaTypes[connectionTypeName],
      args: allQueryArgs({ whereType, orderByType }),
      isDeprecated: false,
      name,
      resolve: async (parent, args, context) => {
        return {
          _selector: await applyInputTransform({ parent, context })(
            args.where,
            whereType
          ),
          _skip: args.skip,
          _limit: args.first,
        };
      },
    };
  };

  _createSingleQuery = modelType => {
    let typeWrap = new TypeWrap(modelType);
    let whereUniqueType;
    try {
      whereUniqueType = this._inputType(modelType, KIND.WHERE_UNIQUE);
    } catch (e) {
      return;
    }

    let args = [
      {
        name: 'where',
        type: whereUniqueType,
      },
    ];

    const name = lowercaseFirstLetter(modelType.name);
    this.Query._fields[name] = {
      type: modelType,
      description: undefined,
      args,
      deprecationReason: undefined,
      isDeprecated: false,
      name,
      resolve: async (parent, args, context) => {
        let selector = await applyInputTransform({ parent, context })(
          args.where,
          whereUniqueType
        );
        // let entries = Object.entries(selector);
        // let [selectorField, id] = entries.length ? Object.entries(selector)[0]: ["_id"];
        if (typeWrap.isInherited()) {
          selector[
            typeWrap.interfaceType().mmDiscriminatorField
          ] = typeWrap.realType().mmDiscriminator;
        }
        return this.QueryExecutor({
          type: FIND_ONE,
          collection: modelType.mmCollectionName,
          selector,
          options: {
            // selectorField,
            // id,
          },
          context,
        });
      },
    };
  };

  _createCreateMutation = modelType => {
    let typeWrap = new TypeWrap(modelType);
    let args = [];
    let inputType;
    try {
      inputType = this._inputType(modelType, KIND.CREATE);
      args = [
        {
          type: new GraphQLNonNull(inputType),
          name: 'data',
        },
      ];
    } catch (e) {}

    const name = `create${modelType.name}`;
    this.Mutation._fields[name] = {
      type: modelType,
      args: args,
      isDeprecated: false,
      name,
      resolve: async (parent, args, context) => {
        // let data = await applyAlwaysInputTransform({ parent, context })(
        //   modelType,
        //   args.data,
        //   KIND.CREATE_ALWAYS
        // );
        let doc = await applyInputTransform({ parent, context })(
          args.data,
          inputType
        );

        if (typeWrap.isInherited()) {
          doc[
            typeWrap.interfaceType().mmDiscriminatorField
          ] = typeWrap.realType().mmDiscriminator;
        }

        return this.QueryExecutor({
          type: INSERT_ONE,
          collection: modelType.mmCollectionName,
          doc,
          options: {},
          context,
        });
      },
    };
  };

  _createDeleteMutation = modelType => {
    let typeWrap = new TypeWrap(modelType);
    let whereUniqueType;
    try {
      whereUniqueType = this._inputType(modelType, KIND.WHERE_UNIQUE);
    } catch (e) {
      return;
    }

    let args = [
      {
        type: new GraphQLNonNull(whereUniqueType),
        name: 'where',
      },
    ];

    const name = `delete${modelType.name}`;
    this.Mutation._fields[name] = {
      type: modelType,
      args,
      isDeprecated: false,
      name,
      resolve: async (parent, args, context) => {
        let selector = await applyInputTransform({ parent, context })(
          args.where,
          whereUniqueType
        );
        if (typeWrap.isInherited()) {
          selector[
            typeWrap.interfaceType().mmDiscriminatorField
          ] = typeWrap.realType().mmDiscriminator;
        }

        return this.QueryExecutor({
          type: DELETE_ONE,
          collection: modelType.mmCollectionName,
          selector,
          options: {},
          context,
        });
      },
    };
  };

  _createUpdateMutation = modelType => {
    let typeWrap = new TypeWrap(modelType);
    let args;
    let whereType, updateType;
    try {
      whereType = this._inputType(modelType, KIND.WHERE_UNIQUE);
      updateType = this._inputType(modelType, KIND.UPDATE);
    } catch (e) {
      return;
    }
    args = [
      {
        type: new GraphQLNonNull(updateType),
        name: 'data',
      },
      {
        type: new GraphQLNonNull(whereType),
        name: 'where',
      },
    ];
    // }

    const name = `update${modelType.name}`;
    this.Mutation._fields[name] = {
      type: modelType,
      args,
      isDeprecated: false,
      name,
      resolve: async (parent, args, context) => {
        // let data = await applyAlwaysInputTransform({ parent, context })(
        //   modelType,
        //   args.data,
        //   KIND.UPDATE_ALWAYS
        // );
        let data = await applyInputTransform({ parent, context })(
          args.data,
          updateType
        );
        let { doc, validations, arrayFilters } = prepareUpdateDoc(data);
        // console.log(doc, validations, arrayFilters);
        let selector = await applyInputTransform({ parent, context })(
          args.where,
          whereType
        );
        if (Object.keys(validations).length !== 0) {
          selector = { $and: [selector, validations] };
        }

        if (typeWrap.isInherited()) {
          selector[
            typeWrap.interfaceType().mmDiscriminatorField
          ] = typeWrap.realType().mmDiscriminator;
        }

        return this.QueryExecutor({
          type: UPDATE_ONE,
          collection: modelType.mmCollectionName,
          selector,
          doc,
          options: { arrayFilters },
          context,
        });
      },
    };
  };

  _onSchemaInit = type => {
    if (type.mmOnSchemaInit) {
      type.mmOnSchemaInit({ type, inputTypes: InputTypes });
    }
    Object.values(type._fields || {}).forEach(field => {
      if (field.mmOnSchemaInit) {
        field.mmOnSchemaInit({ field, inputTypes: InputTypes });
      }
    });
  };

  _onSchemaBuild = type => {
    if (type.mmOnSchemaBuild) {
      type.mmOnSchemaBuild({ type, inputTypes: InputTypes });
    }
    Object.values(type._fields || {}).forEach(field => {
      if (field.mmOnSchemaBuild) {
        field.mmOnSchemaBuild({ field, inputTypes: InputTypes });
      }
    });
  };

  _onTypeInit = type => {
    let init = this.TypesInit[type.name];
    if (init) {
      init({ type, inputTypes: InputTypes });
    }
  };

  _onFieldsInit = type => {
    Object.values(type._fields || {}).forEach(field => {
      let lastType = getLastType(field.type);
      let init = this.FieldsInit[lastType.name];
      if (init) {
        init({ field, inputTypes: InputTypes });
      }
    });
  };

  makeExecutableSchema = params => {
    let {
      schemaDirectives = {},
      directiveResolvers = {},
      resolvers = {},
      typeDefs = [],
    } = params;
    if (!Array.isArray(typeDefs)) typeDefs = [typeDefs];

    typeDefs = [
      InitialScheme,
      AbstractScheme,
      InheritScheme,
      ModelScheme,
      DirectiveDBScheme,
      RelationScheme,
      IDScheme,
      UniqueScheme,
      ExtRelationScheme,
      ...ScalarsSchemes,
      ...typeDefs,
    ];

    schemaDirectives = {
      ...schemaDirectives,
      relation: Relation(this.QueryExecutor),
      extRelation: ExtRelation(this.QueryExecutor),
      db: DirectiveDB,
      abstract: Abstract,
      inherit: Inherit,
      model: Model,
      unique: Unique,
      id: ID,
    };

    directiveResolvers = {
      ...directiveResolvers,
      db: DirectiveDBResolver,
    };

    resolvers = {
      ...resolvers,
      ...Scalars,
    };

    this.Modules.forEach(module => {
      if (module.typeDef) typeDefs.push(module.typeDef);
      if (module.resolvers) resolvers = _.merge(resolvers, module.resolvers);
      if (module.schemaDirectives)
        schemaDirectives = _.merge(schemaDirectives, module.schemaDirectives);
      if (module.typesInit)
        this.TypesInit = _.merge(this.TypesInit, module.typesInit);
      if (module.fieldsInit)
        this.FieldsInit = _.merge(this.FieldsInit, module.fieldsInit);
    });

    let modelParams = {
      ...params,
      typeDefs,
      schemaDirectives,
      directiveResolvers,
      resolvers,
    };

    let schema = makeGraphQLSchema(modelParams);

    let { _typeMap: SchemaTypes } = schema;
    let { Query, Mutation } = SchemaTypes;

    this.SchemaTypes = SchemaTypes;
    this.Query = Query;
    this.Mutation = Mutation;

    Object.values(SchemaTypes).forEach(type => {
      this._onSchemaBuild(type);
    });

    Object.values(SchemaTypes).forEach(type => {
      this._onTypeInit(type);
    });

    Object.values(SchemaTypes).forEach(type => {
      this._onFieldsInit(type);
    });

    Object.values(SchemaTypes).forEach(type => {
      let typeWrap = new TypeWrap(type);
      if (
        getDirective(type, 'model') ||
        (typeWrap.isInherited() &&
          getDirective(typeWrap.interfaceType(), 'model'))
      ) {
        this._createAggregateAndConnectionTypes(type);
      }
    });

    Object.values(SchemaTypes).forEach(type => {
      this._onSchemaInit(type);

      let typeWrap = new TypeWrap(type);
      if (
        getDirective(type, 'model') ||
        (typeWrap.isInherited() &&
          getDirective(typeWrap.interfaceType(), 'model'))
      ) {
        this._createAllQuery(type);
        this._createSingleQuery(type);
        this._createConnectionQuery(type);

        if (!typeWrap.isInterface()) {
          this._createCreateMutation(type);
        }
        this._createDeleteMutation(type);
        this._createUpdateMutation(type);
        // }
      }
    });

    return schema;
  };
}
