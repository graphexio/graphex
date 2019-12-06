import { COUNT, FIND } from '@apollo-model/mongodb-executor';
import TypeWrap from '@apollo-model/type-wrap';
import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLString,
  GraphQLUnionType,
} from 'graphql';
import { makeExecutableSchema as makeGraphQLSchema } from 'graphql-tools';
import _ from 'lodash';
import pluralize from 'pluralize';
import appendField from './appendField';
import InitialScheme from './initialScheme';
import InputTypes, { EmptyTypeException } from './inputTypes';
import { INPUT_TYPE_KIND } from './inputTypes/kinds';
import { applyInputTransform } from './inputTypes/utils';
import {
  getMethodName,
  MULTIPLE_PAGINATION_QUERY,
  SINGLE_QUERY,
} from './methodKinds.js';
import { AMModelCreateMutationFieldFactory } from './modelMutationFields/createMutation';
import { AMModelDeleteManyMutationFieldFactory } from './modelMutationFields/deleteManyMutation';
import { AMModelDeleteOneMutationFieldFactory } from './modelMutationFields/deleteOneMutation';
import { AMModelUpdateMutationFieldFactory } from './modelMutationFields/updateMutation';
import { AMModelMultipleQueryFieldFactory } from './modelQueryFields/multipleQuery';
import { AMModelSingleQueryFieldFactory } from './modelQueryFields/singleQuery';
import Modules from './modules';
import { prepare } from './prepare/prepare';
import {
  allQueryArgs,
  getDirective,
  getLastType,
  lowercaseFirstLetter,
} from './utils';
const { printSchema } = require('@apollo/federation');

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
    appendField(
      this.Schema,
      this.Schema.getQueryType(),
      AMModelMultipleQueryFieldFactory,
      modelType
    );
  };

  _createSingleQuery = modelType => {
    appendField(
      this.Schema,
      this.Schema.getQueryType(),
      AMModelSingleQueryFieldFactory,
      modelType
    );
  };

  _paginationType = type => {
    return InputTypes._paginationType(type);
  };

  _createAllPaginationQuery = modelType => {
    let typeWrap = new TypeWrap(modelType);
    let whereType, orderByType, paginationType;
    try {
      whereType = this._inputType(modelType, INPUT_TYPE_KIND.WHERE);
      orderByType = this._inputType(modelType, INPUT_TYPE_KIND.ORDER_BY);
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
      whereType = this._inputType(modelType, INPUT_TYPE_KIND.WHERE);
      orderByType = this._inputType(modelType, INPUT_TYPE_KIND.ORDER_BY);
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

  _createCreateMutation = modelType => {
    appendField(
      this.Schema,
      this.Schema.getMutationType(),
      AMModelCreateMutationFieldFactory,
      modelType
    );
  };

  _createDeleteOneMutation = modelType => {
    appendField(
      this.Schema,
      this.Schema.getMutationType(),
      AMModelDeleteOneMutationFieldFactory,
      modelType
    );
  };

  _createDeleteManyMutation = modelType => {
    appendField(
      this.Schema,
      this.Schema.getMutationType(),
      AMModelDeleteManyMutationFieldFactory,
      modelType
    );
  };

  _createUpdateMutation = modelType => {
    appendField(
      this.Schema,
      this.Schema.getMutationType(),
      AMModelUpdateMutationFieldFactory,
      modelType
    );
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
                let { __typename, ...params } = representation;

                //run parseValue for custom scalars
                const fields = this.SchemaTypes[__typename].getFields();
                params = Object.fromEntries(
                  Object.entries(params).map(([k, v]) => {
                    const typeWrap = new TypeWrap(fields[k].type);
                    return [k, typeWrap.realType().parseValue(v)];
                  })
                );

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

    let fieldFactoriesMap = {};
    let fieldVisitorEventsMap = {};

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
      if (module.typeDefs) typeDefs.push(module.typeDefs);

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

      if (module.fieldFactoriesMap) {
        fieldFactoriesMap = _.merge(
          fieldFactoriesMap,
          module.fieldFactoriesMap
        );
      }
      if (module.fieldVisitorEventsMap) {
        fieldVisitorEventsMap = _.merge(
          fieldVisitorEventsMap,
          module.fieldVisitorEventsMap
        );
      }
    });

    let modelParams = {
      ...params,
      typeDefs,
      schemaDirectives,
      directiveResolvers,
      resolvers,
      resolverValidationOptions: {
        requireResolversForResolveType: false,
      },
    };

    let schema = makeGraphQLSchema(modelParams);
    // let schema = buildFederatedSchema(modules);

    let { _typeMap: SchemaTypes } = schema;
    let { Query, Mutation } = SchemaTypes;

    this.Schema = schema;
    this.SchemaTypes = SchemaTypes;
    this.Query = Query;
    this.Mutation = Mutation;

    prepare(schema, { fieldFactoriesMap, fieldVisitorEventsMap });

    // Object.values(SchemaTypes).forEach(type => {
    //   if (type._fields) {
    //     Object.values(type._fields).forEach(field => {
    //       if (!field.dbName) field.dbName = field.name;
    //     });
    //   }
    // });

    // Object.values(SchemaTypes).forEach(type => {
    //   let typeWrap = new TypeWrap(type);
    //   if (
    //     isCompositeType(type)
    //     // getDirective(type, 'model') ||
    //     // typeWrap.interfaceWithDirective('model')
    //   ) {
    //     Object.values(type.getFields()).forEach(field => {
    //       field.amEnter = (node, transaction, stack) => {
    //         const lastStackItem = R.last(stack);
    //         if (lastStackItem instanceof AMFieldsSelectionContext) {
    //           lastStackItem.addField(field.dbName);
    //         }
    //       };
    //       // field.amLeave=(node, transaction, stack)=>{
    //       //   console.log('leaved');
    //       //   // stack.pop();
    //       // },
    //     });
    //   }
    // });

    // Object.values(SchemaTypes).forEach(type => {
    //   this._onSchemaBuild(type);
    // });

    // Object.values(SchemaTypes).forEach(type => {
    //   this._onTypeInit(type);
    // });

    // Object.values(SchemaTypes).forEach(type => {
    //   this._onFieldsInit(type);
    // });

    // Object.values(SchemaTypes).forEach(type => {
    //   let typeWrap = new TypeWrap(type);
    //   if (
    //     getDirective(type, 'model') ||
    //     typeWrap.interfaceWithDirective('model')
    //   ) {
    //     if (!typeWrap.isAbstract()) {
    //       this._createAggregateAndConnectionTypes(type);
    //     }
    //   }
    // });

    Object.values(SchemaTypes).forEach(type => {
      // this._onSchemaInit(type);

      let typeWrap = new TypeWrap(type);
      if (
        getDirective(type, 'model') ||
        typeWrap.interfaceWithDirective('model')
      ) {
        if (!typeWrap.isAbstract()) {
          // console.log(`Building queries for ${type.name}`);
          this._createAllQuery(type);
          // this._createAllPaginationQuery(type);
          this._createSingleQuery(type);
          // this._createConnectionQuery(type);
          if (!typeWrap.isInterface()) {
            this._createCreateMutation(type);
          }
          this._createDeleteOneMutation(type);
          this._createDeleteManyMutation(type);
          this._createUpdateMutation(type);
        }
      }
    });

    Object.entries(SchemaTypes).forEach(([name, type]) => {
      if (type.getFields) {
        type.getFields();
        if (Object.keys(type.getFields()).length == 0) {
          delete SchemaTypes[name];
        }
      }
    });

    //Remove system directives
    schema._directives = [];

    return schema;
  };
}
