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
  getInputTypeName,
  addResolveMapFilterToSelector,
  applyInputTransform,
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

import Relation, { RelationScheme } from './directives/relation';
import ExtRelation, { ExtRelationScheme } from './directives/extRelation';
import DirectiveDB, {
  DirectiveDBScheme,
  DirectiveDBResolver,
} from './directives/db';
import Model, { ModelScheme } from './directives/model';
import ReadOnly, { ReadOnlyScheme } from './directives/readOnly';
import Unique, { UniqueScheme } from './directives/unique';
import GeoJSON, { typeDef as GeoJSONScheme } from './geoJSON';
import Scalars, { typeDefs as ScalarsSchemes } from './scalars';

import InputTypes from './inputTypes';

const relationFieldDefault = '_id';

export default class ModelMongo {
  constructor({ queryExecutor }) {
    this.QueryExecutor = queryExecutor;
  }

  _inputType = (type, target) => {
    return this.InputTypes.get(type, target);
  };

  _createAllQuery = (modelType, Query, { filterType, orderByType }) => {
    const name = pluralize(modelType.name).toLowerCase();
    Query._fields[name] = {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(modelType))),
      description: undefined,
      args: allQueryArgs({ filterType, orderByType }),
      deprecationReason: undefined,
      isDeprecated: false,
      name,
      resolve: async (parent, args, context, info) => {
        return this.QueryExecutor({
          type: FIND,
          collection: modelType.name,
          selector: await applyInputTransform(args.where, filterType),
          options: { skip: args.skip, limit: args.first, sort: args.orderBy },
          context,
        });
      },
    };
  };

  _createMetaQuery = (
    modelType,
    Query,
    { filterType, orderByType, _QueryMeta }
  ) => {
    const name = `_${pluralize(modelType.name).toLowerCase()}Meta`;
    Query._fields[name] = {
      type: _QueryMeta,
      description: undefined,
      args: allQueryArgs({ filterType, orderByType }),
      deprecationReason: undefined,
      isDeprecated: false,
      name,
      resolve: async (parent, args, context, info) => {
        return {
          count: this.QueryExecutor({
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
  };

  _createSingleQuery = (modelType, Query) => {
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

      const name = modelType.name.toLowerCase();
      Query._fields[name] = {
        type: modelType,
        description: undefined,
        args: argsArr,
        deprecationReason: undefined,
        isDeprecated: false,
        name,
        resolve: async (parent, args, context, info) => {
          return this.QueryExecutor({
            type: FIND_ONE,
            collection: modelType.name,
            selector: await mapFiltersToSelector(args, argsObj),
            options: {},
            context,
          });
        },
      };
    }
  };

  // _createInputType = (type, SchemaTypes) => {
  //   let delayedCreateTypes = [];
  //
  //   let name = `${type.name}Input`;
  //   if (SchemaTypes[name] && !_.isEmpty(_.keys(SchemaTypes[name]._fields)))
  //     return SchemaTypes[name];
  //
  //   let inputType = getInputType(`${type.name}Input`, SchemaTypes);
  //   _.values(type._fields).forEach(field => {
  //     if (field.skipCreate) return;
  //     let newField = _.omit(field, 'resolve');
  //     let newFieldType = newField.type;
  //     let lastType = getLastType(newFieldType);
  //     if (lastType instanceof GraphQLObjectType) {
  //       delayedCreateTypes.push(lastType);
  //       lastType = getInputType(`${lastType.name}Input`, SchemaTypes);
  //       newField.type = cloneSchema(newFieldType, lastType);
  //     }
  //     inputType._fields[field.name] = newField;
  //   });
  //
  //   SchemaTypes[name] = inputType;
  //
  //   delayedCreateTypes.forEach(type => {
  //     createInputType(type, SchemaTypes);
  //   });
  //   return inputType;
  // };

  _createCreateMutation = (modelType, { Mutation, SchemaTypes }) => {
    let argFields = _.values(modelType._fields).filter(
      field => !field.skipCreate && !field.primaryKey
    );

    let args = [
      {
        type: new GraphQLNonNull(this._inputType(modelType, 'create')),
        name: 'data',
      },
    ];
    // let argsArr = argFields.map(field => {
    //   let newArg = _.omit(field, 'resolve');
    //   let type = newArg.type;
    //   let lastType = getLastType(type);
    //   if (lastType instanceof GraphQLObjectType) {
    //     type = cloneSchema(type, this._createInputType(lastType, SchemaTypes));
    //   }
    //   newArg.type = type;
    //
    //   argsObj[field.name] = newArg;
    //   return newArg;
    // });

    const name = `create${modelType.name}`;
    Mutation._fields[name] = {
      type: modelType,
      args: args,
      isDeprecated: false,
      name,
      resolve: (parent, args, context, info) => {
        return this.QueryExecutor({
          type: INSERT,
          collection: modelType.name,
          doc: args,
          options: {},
          context,
        });
      },
    };
  };

  _createDeleteMutator = (modelType, { Mutation, SchemaTypes }) => {
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
        return this.QueryExecutor({
          type: REMOVE,
          collection: modelType.name,
          selector: await mapFiltersToSelector(args, argsObj),
          options: {},
          context,
        });
      },
    };
  };

  _createUpdateMutator = (modelType, { Mutation, SchemaTypes }) => {
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
        return this.QueryExecutor({
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
    let { Query, Mutation, _QueryMeta } = SchemaTypes;

    this.InputTypes = new InputTypes({ SchemaTypes });

    this.SchemaTypes = SchemaTypes;
    this.Query = Query;
    this.Mutation = Mutation;
    this._QueryMeta = _QueryMeta;

    _.keys(SchemaTypes).forEach(key => {
      let modelType = SchemaTypes[key];
      this._onSchemaInit(modelType);

      if (getDirective(modelType, 'model')) {
        let filterType = this._inputType(modelType, 'where');
        let orderByType = this._inputType(modelType, 'orderBy');
        // let orderByType = createOrderByType(modelType, SchemaTypes);
        this._createAllQuery(modelType, Query, {
          filterType,
          orderByType,
        });
        // createMetaQuery(modelType, Query, {
        //   filterType,
        //   orderByType,
        //   _QueryMeta,
        // });
        // createSingleQuery(modelType, Query);
        this._createCreateMutation(modelType, { Mutation, SchemaTypes });
        // createDeleteMutator(modelType, { Mutation, SchemaTypes });
        // createUpdateMutator(modelType, { Mutation, SchemaTypes });
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
    //       let filterType = getInputType(`GeoJSONPointNearInput`, SchemaTypes);
    //       field = {
    //         ...field,
    //         type: filterType,
    //       };
    //     } else if (type instanceof GraphQLObjectType) {
    //       let filterType = getInputType(name, SchemaTypes);
    //       delayedCreateTypes.push(type);
    //       field = {
    //         ...field,
    //         type: filterType,
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
    //                   filterType._fields
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
    //   let filterType = getInputType(name, SchemaTypes);
    //   if (name != 'GeoJSONPointNearFilter') {
    //     ['AND', 'OR'].forEach(modifier => {
    //       fields[modifier] = {
    //         type: new GraphQLList(new GraphQLNonNull(filterType)),
    //         args: [],
    //         name: modifier,
    //         resolveMapFilterToSelector: async params => {
    //           return params.map(param => ({
    //             fieldName: `$${modifier.toLowerCase()}`,
    //             value: Promise.all(
    //               param.value.map(
    //                 async val =>
    //                   await mapFiltersToSelector(val, filterType._fields)
    //               )
    //             ),
    //           }));
    //         },
    //       };
    //     });
    //   }
    //   filterType._fields = fields;
    //   SchemaTypes[name] = filterType;
    //   delayedCreateTypes.forEach(type => {
    //     createWhereInputType(type, SchemaTypes);
    //   });
    //   return filterType;
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
