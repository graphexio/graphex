"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "QueryExecutor", {
  enumerable: true,
  get: function () {
    return _queryExecutor.default;
  }
});
Object.defineProperty(exports, "getLastType", {
  enumerable: true,
  get: function () {
    return _utils.getLastType;
  }
});
Object.defineProperty(exports, "getDirective", {
  enumerable: true,
  get: function () {
    return _utils.getDirective;
  }
});
Object.defineProperty(exports, "getDirectiveArg", {
  enumerable: true,
  get: function () {
    return _utils.getDirectiveArg;
  }
});
Object.defineProperty(exports, "getRelationFieldName", {
  enumerable: true,
  get: function () {
    return _utils.getRelationFieldName;
  }
});
Object.defineProperty(exports, "hasQLListType", {
  enumerable: true,
  get: function () {
    return _utils.hasQLListType;
  }
});
Object.defineProperty(exports, "allQueryArgs", {
  enumerable: true,
  get: function () {
    return _utils.allQueryArgs;
  }
});
Object.defineProperty(exports, "hasQLNonNullType", {
  enumerable: true,
  get: function () {
    return _utils.hasQLNonNullType;
  }
});
Object.defineProperty(exports, "cloneSchema", {
  enumerable: true,
  get: function () {
    return _utils.cloneSchema;
  }
});
Object.defineProperty(exports, "combineResolvers", {
  enumerable: true,
  get: function () {
    return _utils.combineResolvers;
  }
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _graphqlTools = require("graphql-tools");

var _graphql = require("graphql");

var _lodash = _interopRequireDefault(require("lodash"));

var _pluralize = _interopRequireDefault(require("pluralize"));

var _queryExecutor = _interopRequireWildcard(require("./queryExecutor"));

var _utils = require("./utils");

var _typeWrap = _interopRequireDefault(require("./typeWrap"));

var _initialScheme = _interopRequireDefault(require("./initialScheme"));

var _abstract = _interopRequireWildcard(require("./directives/abstract"));

var _inherit = _interopRequireWildcard(require("./directives/inherit"));

var _relation = _interopRequireWildcard(require("./directives/relation"));

var _extRelation = _interopRequireWildcard(require("./directives/extRelation"));

var _db = _interopRequireWildcard(require("./directives/db"));

var _model = _interopRequireWildcard(require("./directives/model"));

var _unique = _interopRequireWildcard(require("./directives/unique"));

var _id = _interopRequireWildcard(require("./directives/id"));

var _scalars = _interopRequireWildcard(require("./scalars"));

var _modules = _interopRequireDefault(require("./modules"));

var _inputTypes = _interopRequireDefault(require("./inputTypes"));

var _utils2 = require("./inputTypes/utils");

var KIND = _interopRequireWildcard(require("./inputTypes/kinds"));

class ModelMongo {
  constructor({
    queryExecutor,
    options = {}
  }) {
    (0, _defineProperty2.default)(this, "_inputType", (type, target) => {
      return _inputTypes.default.get(type, target);
    });
    (0, _defineProperty2.default)(this, "_createAllQuery", modelType => {
      let typeWrap = new _typeWrap.default(modelType);
      let whereType, orderByType;

      try {
        whereType = this._inputType(modelType, KIND.WHERE);
        orderByType = this._inputType(modelType, KIND.ORDER_BY);
      } catch (e) {
        return;
      }

      const name = (0, _utils.lowercaseFirstLetter)((0, _pluralize.default)(modelType.name));
      this.Query._fields[name] = {
        type: new _graphql.GraphQLNonNull(new _graphql.GraphQLList(new _graphql.GraphQLNonNull(modelType))),
        args: (0, _utils.allQueryArgs)({
          whereType,
          orderByType
        }),
        isDeprecated: false,
        name,
        resolve: async (parent, args, context) => {
          let selector = await (0, _utils2.applyInputTransform)({
            parent,
            context
          })(args.where, whereType);

          if (typeWrap.isInherited()) {
            selector[typeWrap.interfaceType().mmDiscriminatorField] = typeWrap.realType().mmDiscriminator;
          }

          return this.QueryExecutor({
            type: _queryExecutor.FIND,
            modelType,
            collection: modelType.mmCollectionName,
            selector,
            options: {
              skip: args.skip,
              limit: args.first,
              sort: args.orderBy
            },
            context
          });
        }
      };
    });
    (0, _defineProperty2.default)(this, "_paginationType", type => {
      return _inputTypes.default._paginationType(type);
    });
    (0, _defineProperty2.default)(this, "_createAllPaginationQuery", modelType => {
      let typeWrap = new _typeWrap.default(modelType);
      let whereType, orderByType, paginationType;

      try {
        whereType = this._inputType(modelType, KIND.WHERE);
        orderByType = this._inputType(modelType, KIND.ORDER_BY);
        paginationType = this._paginationType(modelType);
      } catch (e) {
        console.log(e);
        return;
      }

      const returnFieldName = (0, _utils.lowercaseFirstLetter)((0, _pluralize.default)(modelType.name));
      const name = `${returnFieldName}Paged`;
      this.Query._fields[name] = {
        type: new _graphql.GraphQLNonNull(paginationType),
        args: (0, _utils.allQueryArgs)({
          whereType,
          orderByType
        }),
        isDeprecated: false,
        name,
        resolve: async (parent, args, context) => {
          let selector = await (0, _utils2.applyInputTransform)({
            parent,
            context
          })(args.where, whereType);

          if (typeWrap.isInherited()) {
            selector[typeWrap.interfaceType().mmDiscriminatorField] = typeWrap.realType().mmDiscriminator;
          }

          let total = await this.QueryExecutor({
            type: _queryExecutor.COUNT,
            modelType,
            collection: modelType.mmCollectionName,
            selector,
            context
          });
          let results = await this.QueryExecutor({
            type: _queryExecutor.FIND,
            modelType,
            collection: modelType.mmCollectionName,
            selector,
            options: {
              skip: args.skip,
              limit: args.first,
              sort: args.orderBy
            },
            context
          });
          let {
            first = results.length,
            skip = 0
          } = args;
          let cursor = {
            first,
            skip
          };
          console.log(args, first, skip, total);
          let hasMore = first + skip < total;
          return {
            cursor,
            hasMore,
            total,
            [returnFieldName]: results
          };
        }
      };
    });
    (0, _defineProperty2.default)(this, "_createAggregateAndConnectionTypes", modelType => {
      let typeWrap = new _typeWrap.default(modelType);
      const aggregateTypeName = `Aggregate${modelType.name}`;
      this.SchemaTypes[aggregateTypeName] = new _graphql.GraphQLObjectType({
        name: aggregateTypeName,
        fields: {
          count: {
            name: 'count',
            type: new _graphql.GraphQLNonNull(_graphql.GraphQLInt),
            resolve: async (parent, args, context) => {
              let selector = parent._selector;

              if (typeWrap.isInherited()) {
                selector[typeWrap.interfaceType().mmDiscriminatorField] = typeWrap.realType().mmDiscriminator;
              }

              return this.QueryExecutor({
                type: _queryExecutor.COUNT,
                collection: modelType.mmCollectionName,
                selector,
                options: {
                  skip: parent._skip,
                  limit: parent._limit
                },
                context
              });
            }
          }
        }
      });
      const connectionTypeName = `${modelType.name}Connection`;
      this.SchemaTypes[connectionTypeName] = new _graphql.GraphQLObjectType({
        name: connectionTypeName,
        fields: {
          aggregate: {
            name: 'aggregate',
            type: new _graphql.GraphQLNonNull(this.SchemaTypes[aggregateTypeName]),
            resolve: async parent => {
              return parent;
            }
          }
        }
      });
    });
    (0, _defineProperty2.default)(this, "_createConnectionQuery", modelType => {
      let whereType, orderByType;

      try {
        whereType = this._inputType(modelType, KIND.WHERE);
        orderByType = this._inputType(modelType, KIND.ORDER_BY);
      } catch (e) {
        return;
      }

      const connectionTypeName = `${modelType.name}Connection`;
      const name = `${(0, _utils.lowercaseFirstLetter)((0, _pluralize.default)(modelType.name))}Connection`;
      this.Query._fields[name] = {
        type: this.SchemaTypes[connectionTypeName],
        args: (0, _utils.allQueryArgs)({
          whereType,
          orderByType
        }),
        isDeprecated: false,
        name,
        resolve: async (parent, args, context) => {
          return {
            _selector: await (0, _utils2.applyInputTransform)({
              parent,
              context
            })(args.where, whereType),
            _skip: args.skip,
            _limit: args.first
          };
        }
      };
    });
    (0, _defineProperty2.default)(this, "_createSingleQuery", modelType => {
      let typeWrap = new _typeWrap.default(modelType);
      let whereUniqueType;

      try {
        whereUniqueType = this._inputType(modelType, KIND.WHERE_UNIQUE);
      } catch (e) {
        return;
      }

      let args = [{
        name: 'where',
        type: whereUniqueType
      }];
      const name = (0, _utils.lowercaseFirstLetter)(modelType.name);
      this.Query._fields[name] = {
        type: modelType,
        description: undefined,
        args,
        deprecationReason: undefined,
        isDeprecated: false,
        name,
        resolve: async (parent, args, context) => {
          let selector = await (0, _utils2.applyInputTransform)({
            parent,
            context
          })(args.where, whereUniqueType); // let entries = Object.entries(selector);
          // let [selectorField, id] = entries.length ? Object.entries(selector)[0]: ["_id"];

          if (typeWrap.isInherited()) {
            selector[typeWrap.interfaceType().mmDiscriminatorField] = typeWrap.realType().mmDiscriminator;
          }

          return this.QueryExecutor({
            type: _queryExecutor.FIND_ONE,
            modelType,
            collection: modelType.mmCollectionName,
            selector,
            options: {// selectorField,
              // id,
            },
            context
          });
        }
      };
    });
    (0, _defineProperty2.default)(this, "_createCreateMutation", modelType => {
      let typeWrap = new _typeWrap.default(modelType);
      let args = [];
      let inputType;

      try {
        inputType = this._inputType(modelType, KIND.CREATE);
        args = [{
          type: new _graphql.GraphQLNonNull(inputType),
          name: 'data'
        }];
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
          let doc = await (0, _utils2.applyInputTransform)({
            parent,
            context
          })(args.data, inputType);

          if (typeWrap.isInherited()) {
            doc[typeWrap.interfaceType().mmDiscriminatorField] = typeWrap.realType().mmDiscriminator;
          }

          return this.QueryExecutor({
            type: _queryExecutor.INSERT_ONE,
            collection: modelType.mmCollectionName,
            doc,
            options: {},
            context
          });
        }
      };
    });
    (0, _defineProperty2.default)(this, "_createDeleteMutation", modelType => {
      let typeWrap = new _typeWrap.default(modelType);
      let whereUniqueType;

      try {
        whereUniqueType = this._inputType(modelType, KIND.WHERE_UNIQUE);
      } catch (e) {
        return;
      }

      let args = [{
        type: new _graphql.GraphQLNonNull(whereUniqueType),
        name: 'where'
      }];
      const name = `delete${modelType.name}`;
      this.Mutation._fields[name] = {
        type: modelType,
        args,
        isDeprecated: false,
        name,
        resolve: async (parent, args, context) => {
          let selector = await (0, _utils2.applyInputTransform)({
            parent,
            context
          })(args.where, whereUniqueType);

          if (typeWrap.isInherited()) {
            selector[typeWrap.interfaceType().mmDiscriminatorField] = typeWrap.realType().mmDiscriminator;
          }

          return this.QueryExecutor({
            type: _queryExecutor.DELETE_ONE,
            collection: modelType.mmCollectionName,
            selector,
            options: {},
            context
          });
        }
      };
    });
    (0, _defineProperty2.default)(this, "_createUpdateMutation", modelType => {
      let typeWrap = new _typeWrap.default(modelType);
      let args;
      let whereType, updateType;

      try {
        whereType = this._inputType(modelType, KIND.WHERE_UNIQUE);
        updateType = this._inputType(modelType, KIND.UPDATE);
      } catch (e) {
        return;
      }

      args = [{
        type: new _graphql.GraphQLNonNull(updateType),
        name: 'data'
      }, {
        type: new _graphql.GraphQLNonNull(whereType),
        name: 'where'
      }]; // }

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
          let data = await (0, _utils2.applyInputTransform)({
            parent,
            context
          })(args.data, updateType);
          let {
            doc,
            validations,
            arrayFilters
          } = (0, _utils.prepareUpdateDoc)(data); // console.log(doc, validations, arrayFilters);

          let selector = await (0, _utils2.applyInputTransform)({
            parent,
            context
          })(args.where, whereType);

          if (Object.keys(validations).length !== 0) {
            selector = {
              $and: [selector, validations]
            };
          }

          if (typeWrap.isInherited()) {
            selector[typeWrap.interfaceType().mmDiscriminatorField] = typeWrap.realType().mmDiscriminator;
          }

          return this.QueryExecutor({
            type: _queryExecutor.UPDATE_ONE,
            collection: modelType.mmCollectionName,
            selector,
            doc,
            options: {
              arrayFilters
            },
            context
          });
        }
      };
    });
    (0, _defineProperty2.default)(this, "_onSchemaInit", type => {
      if (type.mmOnSchemaInit) {
        type.mmOnSchemaInit({
          type,
          inputTypes: _inputTypes.default
        });
      }

      Object.values(type._fields || {}).forEach(field => {
        if (field.mmOnSchemaInit) {
          field.mmOnSchemaInit({
            field,
            inputTypes: _inputTypes.default
          });
        }
      });
    });
    (0, _defineProperty2.default)(this, "_onSchemaBuild", type => {
      if (type.mmOnSchemaBuild) {
        type.mmOnSchemaBuild({
          type,
          inputTypes: _inputTypes.default
        });
      }

      Object.values(type._fields || {}).forEach(field => {
        if (field.mmOnSchemaBuild) {
          field.mmOnSchemaBuild({
            field,
            inputTypes: _inputTypes.default
          });
        }
      });
    });
    (0, _defineProperty2.default)(this, "_onTypeInit", type => {
      let init = this.TypesInit[type.name];

      if (init) {
        init({
          type,
          inputTypes: _inputTypes.default
        });
      }
    });
    (0, _defineProperty2.default)(this, "_onFieldsInit", type => {
      Object.values(type._fields || {}).forEach(field => {
        let lastType = (0, _utils.getLastType)(field.type);
        let init = this.FieldsInit[lastType.name];

        if (init) {
          init({
            field,
            inputTypes: _inputTypes.default
          });
        }
      });
    });
    (0, _defineProperty2.default)(this, "makeExecutableSchema", params => {
      let {
        schemaDirectives = {},
        directiveResolvers = {},
        resolvers = {},
        typeDefs = []
      } = params;
      if (!Array.isArray(typeDefs)) typeDefs = [typeDefs];
      typeDefs = [_initialScheme.default, _abstract.AbstractScheme, _inherit.InheritScheme, _model.ModelScheme, _db.DirectiveDBScheme, _relation.RelationScheme, _id.IDScheme, _unique.UniqueScheme, _extRelation.ExtRelationScheme, ..._scalars.typeDefs, ...typeDefs];
      schemaDirectives = { ...schemaDirectives,
        relation: (0, _relation.default)(this.QueryExecutor),
        extRelation: (0, _extRelation.default)(this.QueryExecutor),
        db: _db.default,
        abstract: _abstract.default,
        inherit: _inherit.default,
        model: _model.default,
        unique: _unique.default,
        id: _id.default
      };
      directiveResolvers = { ...directiveResolvers,
        db: _db.DirectiveDBResolver
      };
      resolvers = { ...resolvers,
        ..._scalars.default
      };
      this.Modules.forEach(module => {
        if (module.typeDef) typeDefs.push(module.typeDef);
        if (module.resolvers) resolvers = _lodash.default.merge(resolvers, module.resolvers);
        if (module.schemaDirectives) schemaDirectives = _lodash.default.merge(schemaDirectives, module.schemaDirectives);
        if (module.typesInit) this.TypesInit = _lodash.default.merge(this.TypesInit, module.typesInit);
        if (module.fieldsInit) this.FieldsInit = _lodash.default.merge(this.FieldsInit, module.fieldsInit);
      });
      let modelParams = { ...params,
        typeDefs,
        schemaDirectives,
        directiveResolvers,
        resolvers
      };
      let schema = (0, _graphqlTools.makeExecutableSchema)(modelParams);
      let {
        _typeMap: SchemaTypes
      } = schema;
      let {
        Query,
        Mutation
      } = SchemaTypes;
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
        let typeWrap = new _typeWrap.default(type);

        if ((0, _utils.getDirective)(type, 'model') || typeWrap.isInherited() && (0, _utils.getDirective)(typeWrap.interfaceType(), 'model')) {
          this._createAggregateAndConnectionTypes(type);
        }
      });
      Object.values(SchemaTypes).forEach(type => {
        this._onSchemaInit(type);

        let typeWrap = new _typeWrap.default(type);

        if ((0, _utils.getDirective)(type, 'model') || typeWrap.isInherited() && (0, _utils.getDirective)(typeWrap.interfaceType(), 'model')) {
          this._createAllQuery(type);

          this._createAllPaginationQuery(type);

          this._createSingleQuery(type);

          this._createConnectionQuery(type);

          if (!typeWrap.isInterface()) {
            this._createCreateMutation(type);
          }

          this._createDeleteMutation(type);

          this._createUpdateMutation(type); // }

        }
      });
      return schema;
    });
    this.QueryExecutor = queryExecutor;
    this.Modules = _modules.default;
    this.TypesInit = {};
    this.FieldsInit = {};
    this.options = options;
  }

}

exports.default = ModelMongo;