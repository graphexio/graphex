import {
  defaultFieldResolver,
  GraphQLInputObjectType,
  GraphQLID,
  GraphQLList,
  GraphQLBoolean,
} from 'graphql';
import {SchemaDirectiveVisitor} from 'graphql-tools';
import {UserInputError} from 'apollo-server';

import _ from 'lodash';

import {
  getRelationFieldName,
  allQueryArgs,
  GraphQLTypeFromString,
  combineResolvers,
  getDirective,
} from '../utils';

import {
  FIND,
  FIND_ONE,
  FIND_IDS,
  DISTINCT,
  INSERT_ONE,
  INSERT_MANY,
  DELETE_ONE,
  COUNT,
} from '../queryExecutor';

import InputTypes from '../inputTypes';
import TypeWrap from '../typeWrap';
import {
  appendTransform,
  reduceTransforms,
  applyInputTransform,
} from '../inputTypes/utils';
import * as HANDLER from '../inputTypes/handlers';
import * as KIND from '../inputTypes/kinds';
import * as Transforms from '../inputTypes/transforms';

export const INPUT_CREATE_ONE_RELATION = 'createOneRelation';
export const INPUT_CREATE_MANY_RELATION = 'createManyRelation';
export const INPUT_UPDATE_ONE_RELATION = 'updateOneRelation';
export const INPUT_UPDATE_MANY_RELATION = 'updateManyRelation';
export const INPUT_UPDATE_ONE_REQUIRED_RELATION = 'updateOneRequiredRelation';
export const INPUT_UPDATE_MANY_REQUIRED_RELATION = 'updateManyRequiredRelation';

export const RelationScheme = `directive @relation(field:String="_id", storeField:String=null ) on FIELD_DEFINITION`;

export default queryExecutor =>
  class RelationDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field, {objectType}) {
      const {_typeMap: SchemaTypes} = this.schema;
      const {field: relationField, storeField} = this.args;
      let fieldTypeWrap = new TypeWrap(field.type);
      
      if (
        !getDirective(fieldTypeWrap.realType(), 'model') &&
        !(
          fieldTypeWrap.isInherited() &&
          getDirective(fieldTypeWrap.interfaceType(), 'model')
        )
      ) {
        throw `Relation field type should be defined with Model directive. (Field '${
          field.name
          }' of type '${fieldTypeWrap.realType().name}')`;
      }
      
      this.mmObjectType = objectType;
      this.mmFieldTypeWrap = fieldTypeWrap;
      this.mmStoreField =
        storeField ||
        getRelationFieldName(
          fieldTypeWrap.realType().name,
          relationField,
          fieldTypeWrap.isMany()
        );
      
      appendTransform(field, HANDLER.TRANSFORM_TO_INPUT, {
        [KIND.ORDER_BY]: field => [],
        [KIND.CREATE]: this._transformToInputCreateUpdate,
        [KIND.UPDATE]: this._transformToInputCreateUpdate,
        [KIND.WHERE]: this._transformToInputWhere,
      });
      field.mmOnSchemaInit = this._onSchemaInit;
      field.mmOnSchemaBuild = this._onSchemaBuild;
      
      field.resolve = fieldTypeWrap.isMany()
        ? this._resolveMany(field)
        : this._resolveSingle(field);
    }
    
    _transformToInputWhere = ({field}) => {
      const {field: relationField} = this.args;
      let {
        mmFieldTypeWrap: fieldTypeWrap,
        mmCollectionName: collection,
        mmStoreField: storeField,
      } = this;
      let inputType = InputTypes.get(fieldTypeWrap.realType(), KIND.WHERE);
      let modifiers = fieldTypeWrap.isMany() ? ['some', 'none'] : [''];
      let fields = [];
      modifiers.forEach(modifier => {
        let fieldName = field.name;
        if (modifier !== '') {
          fieldName = `${field.name}_${modifier}`;
        }
        fields.push({
          name: fieldName,
          type: inputType,
          mmTransform: async params => {
            params = params[fieldName];
            let value = await queryExecutor({
              type: DISTINCT,
              collection,
              selector: await applyInputTransform({})(params, inputType),
              options: {
                key: relationField,
              },
            });
            // if (!isMany) {
            value = {$in: value};
            // }
            return {[storeField]: value};
          },
        });
      });
      return fields;
    };
    //
    // _transformToInputCreateMany = ({ field }) => {
    //   let { mmStoreField: storeField } = this;
    //
    //   let type = InputTypes.get(
    //     new TypeWrap(field.type).realType(),
    //     INPUT_CREATE_MANY_RELATION
    //   );
    //   return [
    //     {
    //       name: field.name,
    //       type,
    //       mmTransform: async params => {
    //         let input = params[field.name];
    //         let ids = [];
    //         if (input.create) {
    //           ////Create
    //           let docs = (await applyInputTransform(input, type)).create;
    //           let create_ids = await this._insertManyQuery({
    //             docs,
    //           });
    //           ids = [...ids, ...create_ids];
    //         }
    //         if (input.connect) {
    //           ////Connect
    //           let selector = (await applyInputTransform(input, type)).connect;
    //           selector = { $or: selector };
    //           let connect_ids = await this._distinctQuery({ selector });
    //           ids = [...ids, ...connect_ids];
    //         }
    //         return { [storeField]: { $mmPushAll: ids } };
    //       },
    //     },
    //   ];
    // };
    
    _transformToInputCreateUpdate = ({field, kind, inputTypes}) => {
      let fieldTypeWrap = new TypeWrap(field.type);
      let isCreate = kind === KIND.CREATE;
      
      let type = inputTypes.get(
        fieldTypeWrap.realType(),
        fieldTypeWrap.isMany()
          ? isCreate
          ? INPUT_CREATE_MANY_RELATION
          : fieldTypeWrap.isRequired()
            ? INPUT_UPDATE_MANY_REQUIRED_RELATION
            : INPUT_UPDATE_MANY_RELATION
          : isCreate
          ? INPUT_CREATE_ONE_RELATION
          : fieldTypeWrap.isRequired()
            ? INPUT_UPDATE_ONE_REQUIRED_RELATION
            : INPUT_UPDATE_ONE_RELATION
      );
      return [
        {
          name: field.name,
          type,
          mmTransform: reduceTransforms([
            Transforms.log(1),
            this._validateInput(type, fieldTypeWrap.isMany()),
            Transforms.applyNestedTransform(type),
            fieldTypeWrap.isMany()
              ? this._transformInputMany
              : this._transformInputOne,
            Transforms.log(2),
          ]),
          
          // async params => {
          //   let input = params[field.name];
          //   ////Create and Connect
          //   if (input.create && input.connect) {
          //     throw new UserInputError(
          //       `You should return only one document for singular relation.`
          //     );
          //   } else if (input.connect) {
          //     ////Connect
          //     let selector = (await applyInputTransform(input, type)).connect;
          //     let ids = await this._distinctQuery({
          //       selector,
          //     });
          //     if (ids.length === 0) {
          //       throw new UserInputError(
          //         `No records found for selector - ${JSON.stringify(selector)}`
          //       );
          //     }
          //     return { [storeField]: _.head(ids) };
          //   } else if (input.create) {
          //     ////Create
          //     let doc = (await applyInputTransform(input, type)).create;
          //     let id = await this._insertOneQuery({
          //       doc,
          //     });
          //     return { [storeField]: id };
          //   } else {
          //     ////Nothing
          //     return {};
          //   }
          // },
        },
      ];
    };
    
    _validateInput = (type, isMany) => params => {
      let input = _.head(_.values(params));
      if (!isMany) {
        if (_.keys(input) > 1) {
          throw new UserInputError(
            `You should not fill multiple fields in ${type.name} type`
          );
        } else if (_.keys(input) === 0) {
          throw new UserInputError(
            `You should fill any field in ${type.name} type`
          );
        }
      } else {
        if (
          (input.disconnect || input.delete) &&
          _.difference(_.keys(input), ['delete', 'disconnect']).length > 0
        ) {
          throw new UserInputError(`Wrong input in ${type.name} type`);
        }
      }
      return params;
    };
    
    _transformInputOne = async params => {
      let {mmStoreField: storeField} = this;
      let input = _.head(_.values(params));
      if (input.connect) {
        ////Connect
        let selector = input.connect;
        let ids = await this._distinctQuery({
          selector,
        });
        if (ids.length === 0) {
          throw new UserInputError(
            `No records found for selector - ${JSON.stringify(selector)}`
          );
        }
        return {[storeField]: _.head(ids)};
      } else if (input.create) {
        ////Create
        let doc = input.create;
        let id = await this._insertOneQuery({
          doc,
        });
        return {[storeField]: id};
      } else if (input.disconnect) {
        ////Disconnect
        return {
          [storeField]: null,
        };
      } else if (input.delete) {
        ////Delete
      }
    };
    
    _transformInputMany = async params => {
      let {mmStoreField: storeField} = this;
      let input = _.head(_.values(params));
      
      let ids = [];
      
      if (input.disconnect || input.delete) {
        if (input.disconnect) {
          ////Disconnect
          let selector = {$or: input.disconnect};
          ids = await this._distinctQuery({
            selector,
          });
          if (ids.length === 0) {
            throw new UserInputError(
              `No records found for selector - ${JSON.stringify(selector)}`
            );
          }
        }
        if (input.delete) {
          let delete_ids = input.delete.map(selector =>
            this._deleteOneQuery({selector})
          );
          delete_ids = await Promise.all(delete_ids);
          delete_ids = delete_ids.filter(id => id);
          ids = [...ids, ...delete_ids];
        }
        return {[storeField]: {$mmPullAll: ids}};
      } else {
        if (input.connect) {
          ////Connect
          let selector = {$or: input.connect};
          ids = await this._distinctQuery({
            selector,
          });
          // if (ids.length === 0) {
          //   throw new UserInputError(
          //     `No records found for selector - ${JSON.stringify(selector)}`
          //   );
          // }
        }
        if (input.create) {
          ////Create
          let docs = input.create;
          let create_ids = await this._insertManyQuery({
            docs,
          });
          ids = [...ids, ...create_ids];
        }
        return {[storeField]: {$mmPushAll: ids}};
      }
    };
    
    _onSchemaBuild = ({field}) => {
      let fieldTypeWrap = new TypeWrap(field.type);
      
      //Collection name and interface modifier
      if (fieldTypeWrap.isInherited()) {
        let {mmDiscriminator} = fieldTypeWrap.realType();
        let {mmDiscriminatorField} = fieldTypeWrap.interfaceType();
        
        this.mmCollectionName = fieldTypeWrap.realType().mmCollectionName;
        this.mmInterfaceModifier = {
          [mmDiscriminatorField]: mmDiscriminator,
        };
      } else {
        this.mmInterfaceModifier = {};
        this.mmCollectionName = fieldTypeWrap.realType().mmCollectionName;
      }
    };
    
    _onSchemaInit = ({field}) => {
      let fieldTypeWrap = new TypeWrap(field.type);
      
      ///Args and connection field
      if (fieldTypeWrap.isMany()) {
        let whereType = InputTypes.get(
          fieldTypeWrap.realType(),
          fieldTypeWrap.isInterface() ? KIND.WHERE_INTERFACE : KIND.WHERE
        );
        let orderByType = InputTypes.get(
          fieldTypeWrap.realType(),
          KIND.ORDER_BY
        );
        
        field.args = allQueryArgs({
          whereType,
          orderByType,
        });
        
        this._addConnectionField(field);
      }
    };
    
    _resolveSingle = field => async (parent, args, context, info) => {
      const {field: relationField} = this.args;
      let {
        mmCollectionName: collection,
        mmStoreField: storeField,
        mmInterfaceModifier,
      } = this;
      
      let value = parent[storeField];
      let selector = {
        [relationField]: value,
      };
      
      return queryExecutor({
        type: FIND_ONE,
        collection,
        selector: {[relationField]: value, ...mmInterfaceModifier},
        options: {skip: args.skip, limit: args.first, selectorField: relationField, id: value},
        context,
      });
    };
    
    _resolveMany = field => async (parent, args, context, info) => {
      const {field: relationField} = this.args;
      let {
        mmFieldTypeWrap: fieldTypeWrap,
        mmCollectionName: collection,
        mmStoreField: storeField,
        mmInterfaceModifier,
      } = this;
      
      let whereType = InputTypes.get(
        fieldTypeWrap.realType(),
        fieldTypeWrap.isInterface() ? KIND.WHERE_INTERFACE : KIND.WHERE
      );
      
      let value = parent[storeField];
      if (!value) return fieldTypeWrap.isRequired() ? [] : null;
      
      let selector = await applyInputTransform({parent, context})(args.where, whereType);
      if (fieldTypeWrap.isInterface()) {
        selector = Transforms.validateAndTransformInterfaceInput(whereType)({
          selector,
        }).selector;
      }
      
      selector = {
        ...selector,
        [relationField]: {$in: value},
        ...mmInterfaceModifier,
      };
      let type = Object.keys(selector).length > 1 || args.skip || args.first ? FIND : FIND_IDS;
      let docs = await queryExecutor({
        type,
        collection,
        selector,
        options: {skip: args.skip, limit: args.first, selectorField: relationField, ids: value},
        context,
      });
      return docs;
      // let docsIndex = {};
      // docs.forEach(doc => {
      //   docsIndex[doc[relationField]] = doc;
      // });
      // return value.map(item => docsIndex[item]);
    };
    
    _addConnectionField = field => {
      const {field: relationField} = this.args;
      let {
        mmFieldTypeWrap: fieldTypeWrap,
        mmCollectionName: collection,
        mmStoreField: storeField,
      } = this;
      const {_typeMap: SchemaTypes} = this.schema;
      
      let whereType = InputTypes.get(fieldTypeWrap.realType(), 'where');
      let orderByType = InputTypes.get(fieldTypeWrap.realType(), 'orderBy');
      
      let connectionName = `${field.name}Connection`;
      this.mmObjectType._fields[connectionName] = {
        name: connectionName,
        isDeprecated: false,
        args: allQueryArgs({
          whereType,
          orderByType,
        }),
        type: SchemaTypes[`${fieldTypeWrap.realType().name}Connection`],
        resolve: async (parent, args, context, info) => {
          let value = parent[storeField];
          if (_.isArray(value)) {
            value = {$in: value};
          }
          let selector = {
            $and: [
              await applyInputTransform({parent, context})(args.where, whereType),
              {[relationField]: value},
            ],
          };
          return {
            _selector: selector,
            _skip: args.skip,
            _limit: args.first,
          };
        },
        [HANDLER.TRANSFORM_TO_INPUT]: {
          [KIND.CREATE]: () => [],
          [KIND.WHERE]: () => [],
          [KIND.UPDATE]: () => [],
          [KIND.ORDER_BY]: () => [],
        },
      };
    };
    
    _distinctQuery = async ({selector}) => {
      const {field: relationField} = this.args;
      let {
        mmCollectionName: collection,
        mmStoreField: storeField,
        mmInterfaceModifier,
      } = this;
      selector = {...selector, ...mmInterfaceModifier};
      
      return queryExecutor({
        type: DISTINCT,
        collection,
        selector,
        options: {
          key: relationField,
        },
      });
    };
    
    _deleteOneQuery = async ({selector}) => {
      const {field: relationField} = this.args;
      let {
        mmCollectionName: collection,
        mmStoreField: storeField,
        mmInterfaceModifier,
      } = this;
      selector = {...selector, ...mmInterfaceModifier};
      
      return queryExecutor({
        type: DELETE_ONE,
        collection,
        selector,
      }).then(res => (res ? res[relationField] : null));
    };
    
    _insertOneQuery = async ({doc}) => {
      const {field: relationField} = this.args;
      let {
        mmCollectionName: collection,
        mmStoreField: storeField,
        mmInterfaceModifier,
      } = this;
      doc = {...doc, ...mmInterfaceModifier};
      
      return queryExecutor({
        type: INSERT_ONE,
        collection,
        doc,
      }).then(res => res[relationField]);
    };
    
    _insertManyQuery = async ({docs}) => {
      const {field: relationField} = this.args;
      let {
        mmCollectionName: collection,
        mmStoreField: storeField,
        mmInterfaceModifier,
      } = this;
      docs = docs.map(doc => ({...doc, ...mmInterfaceModifier}));
      
      return queryExecutor({
        type: INSERT_MANY,
        collection,
        docs,
      }).then(res => res.map(item => item[relationField]));
    };
  };

let createInputTransform = (type, isInterface) =>
  reduceTransforms([
    Transforms.applyNestedTransform(type),
    isInterface ? Transforms.validateAndTransformInterfaceInput(type) : null,
  ]);

const createInput = ({name, initialType, kind, inputTypes}) => {
  let fields = {};
  let typeWrap = new TypeWrap(initialType);
  
  let createType = inputTypes.get(
    initialType,
    typeWrap.isInterface() ? KIND.CREATE_INTERFACE : KIND.CREATE
  );
  let whereType = inputTypes.get(
    initialType,
    typeWrap.isInterface() ? KIND.WHERE_INTERFACE : KIND.WHERE
  );
  let whereUniqueType = inputTypes.get(
    initialType,
    typeWrap.isInterface() ? KIND.WHERE_UNIQUE_INTERFACE : KIND.WHERE_UNIQUE
  );
  
  if (
    [
      INPUT_CREATE_MANY_RELATION,
      INPUT_UPDATE_MANY_RELATION,
      INPUT_UPDATE_MANY_REQUIRED_RELATION,
    ].includes(kind)
  ) {
    createType = new GraphQLList(createType);
    whereType = new GraphQLList(whereType);
    whereUniqueType = new GraphQLList(whereUniqueType);
  }
  
  fields.create = {
    name: 'create',
    type: createType,
    mmTransform: createInputTransform(createType, typeWrap.isInterface()),
  };
  fields.connect = {
    name: 'connect',
    type: whereUniqueType,
    mmTransform: createInputTransform(whereUniqueType, typeWrap.isInterface()),
  };
  
  if (kind === INPUT_UPDATE_ONE_RELATION) {
    fields.disconnect = {
      name: 'disconnect',
      type: GraphQLBoolean,
    };
    
    // fields.delete = {
    //   name: 'delete',
    //   type: GraphQLBoolean,
    // };
  }
  
  if (
    [INPUT_UPDATE_MANY_RELATION, INPUT_UPDATE_MANY_REQUIRED_RELATION].includes(
      kind
    )
  ) {
    fields.disconnect = {
      name: 'disconnect',
      type: whereType,
      mmTransform: createInputTransform(whereType, typeWrap.isInterface()),
    };
    
    fields.delete = {
      name: 'delete',
      type: whereUniqueType,
      mmTransform: createInputTransform(
        whereUniqueType,
        typeWrap.isInterface()
      ),
    };
  }
  
  let newType = new GraphQLInputObjectType({
    name,
    fields,
  });
  newType.getFields();
  return newType;
};

InputTypes.registerKind(INPUT_CREATE_ONE_RELATION, createInput);
InputTypes.registerKind(INPUT_CREATE_MANY_RELATION, createInput);
InputTypes.registerKind(INPUT_UPDATE_ONE_RELATION, createInput);
InputTypes.registerKind(INPUT_UPDATE_MANY_RELATION, createInput);
InputTypes.registerKind(INPUT_UPDATE_ONE_REQUIRED_RELATION, createInput);
InputTypes.registerKind(INPUT_UPDATE_MANY_REQUIRED_RELATION, createInput);
