import { makeExecutableSchema as makeGraphQLSchema } from 'graphql-tools';
const { printSchema } = require('@apollo/federation');
import federationDirectives from '@apollo/federation/dist/directives';

import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
  GraphQLScalarType,
} from 'graphql';
import _ from 'lodash';
import pluralize from 'pluralize';

import {
  COUNT,
  DELETE_MANY,
  DELETE_ONE,
  FIND,
  FIND_ONE,
  INSERT_ONE,
  UPDATE_ONE,
} from '@apollo-model/mongodb-executor';

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
import TypeWrap from '@apollo-model/type-wrap';

import InitialScheme from './initialScheme';
import Modules from './modules';

import InputTypes, { EmptyTypeException } from './inputTypes';
import { applyInputTransform } from './inputTypes/utils';

import * as KIND from './inputTypes/kinds';

import {
  SINGLE_QUERY,
  MULTIPLE_QUERY,
  CONNECTION_QUERY,
  MULTIPLE_PAGINATION_QUERY,
  CREATE_MUTATION,
  DELETE_MUTATION,
  DELETE_MANY_MUTATION,
  UPDATE_MUTATION,
  getMethodName,
} from './methodKinds.js';

export default class ModelMongo {
  constructor({ queryExecutor, options = {}, modules = [] }) {
    this.QueryExecutor = queryExecutor;
    this.Modules = [...Modules, ...modules];
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
      if (e instanceof EmptyTypeException) {
        return;
      } else throw e;
    }

    const name = getMethodName(MULTIPLE_QUERY)(modelType.name);
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
        if (
          typeWrap.interfaceWithDirective('model') &&
          typeWrap.interfaceWithDirective('model').mmDiscriminatorField
          // && !new TypeWrap(typeWrap.interfaceType()).isAbstract()
        ) {
          selector[
            typeWrap.interfaceWithDirective('model').mmDiscriminatorField
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

  _paginationType = type => {
    return InputTypes._paginationType(type);
  };

  _createAllPaginationQuery = modelType => {
    let typeWrap = new TypeWrap(modelType);
    let whereType, orderByType, paginationType;
    try {
      whereType = this._inputType(modelType, KIND.WHERE);
      orderByType = this._inputType(modelType, KIND.ORDER_BY);
      paginationType = this._paginationType(modelType);
    } catch (e) {
      if (e instanceof EmptyTypeException) {
        return;
      } else throw e;
    }

    const returnFieldName = lowercaseFirstLetter(pluralize(modelType.name));

    const name = getMethodName(MULTIPLE_PAGINATION_QUERY)(modelType.name);
    this.Query._fields[name] = {
      type: new GraphQLNonNull(paginationType),
      args: allQueryArgs({ whereType, orderByType }),
      isDeprecated: false,
      name,
      resolve: async (parent, args, context) => {
        let selector = await applyInputTransform({ parent, context })(
          args.where,
          whereType
        );
        if (
          typeWrap.interfaceWithDirective('model') &&
          typeWrap.interfaceWithDirective('model').mmDiscriminatorField
        ) {
          selector[
            typeWrap.interfaceWithDirective('model').mmDiscriminatorField
          ] = typeWrap.realType().mmDiscriminator;
        }
        let total = await this.QueryExecutor({
          type: COUNT,
          modelType,
          collection: modelType.mmCollectionName,
          selector,
          context,
        });
        let results = await this.QueryExecutor({
          type: FIND,
          modelType,
          collection: modelType.mmCollectionName,
          selector,
          options: { skip: args.skip, limit: args.first, sort: args.orderBy },
          context,
        });

        let { first = results.length, skip = 0 } = args;
        let cursor = {
          first,
          skip,
        };
        // console.log(args, first, skip, total);
        let hasMore = first + skip < total;

        return {
          cursor,
          hasMore,
          total,
          [returnFieldName]: results,
        };
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
            if (
              typeWrap.interfaceWithDirective('model') &&
              typeWrap.interfaceWithDirective('model').mmDiscriminatorField
              // && !new TypeWrap(typeWrap.interfaceType()).isAbstract()
            ) {
              selector[
                typeWrap.interfaceWithDirective('model').mmDiscriminatorField
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
      if (e instanceof EmptyTypeException) {
        return;
      } else throw e;
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
      if (e instanceof EmptyTypeException) {
        return;
      } else throw e;
    }

    let args = [
      {
        name: 'where',
        type: whereUniqueType,
      },
    ];

    const name = getMethodName(SINGLE_QUERY)(modelType.name);

    const resolve = async (parent, args, context) => {
      let selector = await applyInputTransform({ parent, context })(
        args.where,
        whereUniqueType
      );
      // let entries = Object.entries(selector);
      // let [selectorField, id] = entries.length ? Object.entries(selector)[0]: ["_id"];
      if (
        typeWrap.interfaceWithDirective('model') &&
        typeWrap.interfaceWithDirective('model').mmDiscriminatorField
        // && !new TypeWrap(typeWrap.interfaceType()).isAbstract()
      ) {
        selector[
          typeWrap.interfaceWithDirective('model').mmDiscriminatorField
        ] = typeWrap.realType().mmDiscriminator;
      }
      return this.QueryExecutor({
        type: FIND_ONE,
        modelType,
        collection: modelType.mmCollectionName,
        selector,
        options: {
          // selectorField,
          // id,
        },
        context,
      });
    };

    this.Query._fields[name] = {
      type: modelType,
      description: undefined,
      args,
      deprecationReason: undefined,
      isDeprecated: false,
      name,
      resolve,
      __ammResolve: resolve,
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
    } catch (e) {
      if (!(e instanceof EmptyTypeException)) {
        throw e;
      }
    }

    const name = getMethodName(CREATE_MUTATION)(modelType.name);
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

        if (
          typeWrap.interfaceWithDirective('model') &&
          typeWrap.interfaceWithDirective('model').mmDiscriminatorField
          // && !new TypeWrap(typeWrap.interfaceType()).isAbstract()
        ) {
          doc[
            typeWrap.interfaceWithDirective('model').mmDiscriminatorField
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
      if (e instanceof EmptyTypeException) {
        return;
      } else throw e;
    }

    let args = [
      {
        type: new GraphQLNonNull(whereUniqueType),
        name: 'where',
      },
    ];

    const name = getMethodName(DELETE_MUTATION)(modelType.name);
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
        if (
          typeWrap.interfaceWithDirective('model') &&
          typeWrap.interfaceWithDirective('model').mmDiscriminatorField
          // && !new TypeWrap(typeWrap.interfaceType()).isAbstract()
        ) {
          selector[
            typeWrap.interfaceWithDirective('model').mmDiscriminatorField
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

  _createDeleteManyMutation = modelType => {
    let typeWrap = new TypeWrap(modelType);
    let whereType;
    try {
      whereType = this._inputType(modelType, KIND.WHERE);
    } catch (e) {
      if (e instanceof EmptyTypeException) {
        return;
      } else throw e;
    }

    let args = [
      {
        type: new GraphQLNonNull(whereType),
        name: 'where',
      },
    ];

    const name = getMethodName(DELETE_MANY_MUTATION)(modelType.name);
    this.Mutation._fields[name] = {
      type: new GraphQLNonNull(GraphQLInt),
      args,
      isDeprecated: false,
      name,
      resolve: async (parent, args, context) => {
        let selector = await applyInputTransform({ parent, context })(
          args.where,
          whereType
        );
        if (
          typeWrap.interfaceWithDirective('model') &&
          typeWrap.interfaceWithDirective('model').mmDiscriminatorField
          // && !new TypeWrap(typeWrap.interfaceType()).isAbstract()
        ) {
          selector[
            typeWrap.interfaceWithDirective('model').mmDiscriminatorField
          ] = typeWrap.realType().mmDiscriminator;
        }

        return this.QueryExecutor({
          type: DELETE_MANY,
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
      if (e instanceof EmptyTypeException) {
        return;
      } else throw e;
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

    const name = getMethodName(UPDATE_MUTATION)(modelType.name);
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
        let {
          doc,
          validations,
          arrayFilters,
          postResolvers,
        } = prepareUpdateDoc(data);
        // console.log(doc, validations, arrayFilters);
        let selector = await applyInputTransform({ parent, context })(
          args.where,
          whereType
        );
        if (Object.keys(validations).length !== 0) {
          selector = { $and: [selector, validations] };
        }

        if (
          typeWrap.interfaceWithDirective('model') &&
          typeWrap.interfaceWithDirective('model').mmDiscriminatorField
          // && !new TypeWrap(typeWrap.interfaceType()).isAbstract()
        ) {
          selector[
            typeWrap.interfaceWithDirective('model').mmDiscriminatorField
          ] = typeWrap.realType().mmDiscriminator;
        }

        return this.QueryExecutor({
          type: UPDATE_ONE,
          collection: modelType.mmCollectionName,
          selector,
          doc,
          options: { arrayFilters },
          context,
        }).then(response => {
          if (Object.keys(postResolvers).length) {
            let promises = [];
            let update = {};
            Object.entries(postResolvers).forEach(([type, resolvers]) => {
              switch (type) {
                case DELETE_ONE:
                  promises = resolvers.map(r => {
                    let { fieldName, collection, relationField } = r;
                    let id = response[fieldName];
                    let _s = { [relationField]: response[fieldName] };
                    return this.QueryExecutor({
                      type,
                      collection,
                      selector: _s,
                    }).then(() => {
                      let { $unset = {} } = update;
                      $unset[fieldName] = 1;
                      update.$unset = $unset;
                    });
                  });
                  break;
              }
            });
            return Promise.all(promises).then(() => {
              return this.QueryExecutor({
                type: UPDATE_ONE,
                collection: modelType.mmCollectionName,
                selector,
                doc: update,
                options: { arrayFilters },
                context,
              });
            });
          }
          return response;
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

  generateKeyDirective = fields => {
    return {
      kind: 'Directive',
      name: { kind: 'Name', value: 'key' },
      arguments: [
        {
          kind: 'Argument',
          name: { kind: 'Name', value: 'fields' },
          value: {
            kind: 'StringValue',
            value: fields,
            block: false,
          },
        },
      ],
    };
  };

  buildFederatedSchema = params => {
    const schema = this.makeExecutableSchema(params);
    let keyTypes = [];
    // schema._directives = [...schema._directives, ...federationDirectives];

    Object.values(this.SchemaTypes).forEach(type => {
      this._onSchemaInit(type);

      let typeWrap = new TypeWrap(type);
      if (
        getDirective(type, 'model') ||
        typeWrap.interfaceWithDirective('model')
      ) {
        if (!typeWrap.isAbstract()) {
          Object.values(type.getFields()).map(field => {
            if (getDirective(field, 'unique')) {
              type.astNode.directives.push(
                this.generateKeyDirective(field.name)
              );
            }
          });
          if (!typeWrap.isInterface()) {
            keyTypes.push(type);
          }
        }
      }
    });

    const sdl = printSchema(schema);

    const _Service = new GraphQLObjectType({
      name: '_Service',
      fields: {
        sdl: {
          name: 'sdl',
          type: GraphQLString,
        },
      },
    });
    this.SchemaTypes._Service = _Service;
    this.Query._fields._service = {
      name: '_service',
      args: [],
      isDeprecated: false,
      type: _Service,
      resolve: () => ({
        sdl,
      }),
    };

    if (keyTypes.length > 0) {
      const _Any = new GraphQLScalarType({
        name: '_Any',
      });

      const _Entity = new GraphQLUnionType({
        name: '_Entity',
        types: keyTypes,
      });

      this.SchemaTypes._Any = _Any;
      this.SchemaTypes._Entity = _Entity;
      this.Query._fields._entities = {
        name: '_entities',
        args: [
          {
            name: 'representations',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(_Any))),
          },
        ],
        isDeprecated: false,
        type: new GraphQLNonNull(new GraphQLList(_Entity)),
        resolve: (obj, { representations }, context) => {
          return Promise.all(
            representations.map(async representation => {
              try {
                const { __typename, params } = representation;

                //Now it just calls FIND_ONE. We should replace it with FIND_IDS.
                const name = getMethodName(SINGLE_QUERY)(__typename);
                let res = await this.Query._fields[name].__ammResolve(
                  null,
                  { where: params },
                  context
                );
                res = { ...res, __typename };
                return res;
              } catch (err) {
                console.log(err);
              }
            })
          );
        },
      };
    }

    return schema;
  };

  makeExecutableSchema = params => {
    let {
      schemaDirectives = {},
      directiveResolvers = {},
      resolvers = {},
      typeDefs = [],
    } = params;

    // let modules = [
    //   ...this.Modules.map(item => ({
    //     typeDefs: item.typeDef,
    //     resolvers: item.resolvers,
    //     directiveResolvers: item.directiveResolvers,
    //     schemaDirectives: item.schemaDirectives,
    //   })),
    //   { typeDefs: InitialScheme },
    //   // {
    //   //   typeDefs,
    //   //   resolvers,
    //   //   directiveResolvers,
    //   //   schemaDirectives,
    //   // },
    // ];

    if (!Array.isArray(typeDefs)) typeDefs = [typeDefs];

    typeDefs = [InitialScheme, ...typeDefs];

    this.Modules.forEach(module => {
      if (module.typeDef) typeDefs.push(module.typeDef);
      if (module.resolvers) resolvers = _.merge(resolvers, module.resolvers);
      if (module.schemaDirectives)
        schemaDirectives = _.merge(schemaDirectives, module.schemaDirectives);
      if (module.directiveResolvers) {
        directiveResolvers = _.merge(
          directiveResolvers,
          module.directiveResolvers
        );
      }
      if (module.typesInit)
        this.TypesInit = _.merge(this.TypesInit, module.typesInit);
      if (module.fieldsInit)
        this.FieldsInit = _.merge(this.FieldsInit, module.fieldsInit);
      if (module.setQueryExecutor) {
        module.setQueryExecutor(this.QueryExecutor);
      }
    });

    let modelParams = {
      ...params,
      typeDefs,
      schemaDirectives,
      directiveResolvers,
      resolvers,
    };

    let schema = makeGraphQLSchema(modelParams);
    // let schema = buildFederatedSchema(modules);

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
        typeWrap.interfaceWithDirective('model')
      ) {
        if (!typeWrap.isAbstract()) {
          this._createAggregateAndConnectionTypes(type);
        }
      }
    });

    Object.values(SchemaTypes).forEach(type => {
      this._onSchemaInit(type);

      let typeWrap = new TypeWrap(type);
      if (
        getDirective(type, 'model') ||
        typeWrap.interfaceWithDirective('model')
      ) {
        if (!typeWrap.isAbstract()) {
          // console.log(`Building queries for ${type.name}`);
          this._createAllQuery(type);
          this._createAllPaginationQuery(type);
          this._createSingleQuery(type);
          this._createConnectionQuery(type);

          if (!typeWrap.isInterface()) {
            this._createCreateMutation(type);
          }
          this._createDeleteMutation(type);
          this._createDeleteManyMutation(type);
          this._createUpdateMutation(type);
        }
      }
    });

    return schema;
  };
}
