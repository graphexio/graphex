import {
  defaultFieldResolver,
  GraphQLInputObjectType,
  GraphQLID,
  GraphQLList,
} from 'graphql';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { UserInputError } from 'apollo-server';

import _ from 'lodash';

import {
  getLastType,
  hasQLListType,
  mapFiltersToSelector,
  getRelationFieldName,
  allQueryArgs,
  GraphQLTypeFromString,
  combineResolvers,
} from '../utils';

import {
  FIND,
  FIND_ONE,
  DISTINCT,
  INSERT_ONE,
  INSERT_MANY,
  COUNT,
} from '../queryExecutor';

import InputTypes, {
  TRANSFORM_TO_INPUT,
  INPUT_WHERE,
  INPUT_WHERE_UNIQUE,
  INPUT_CREATE,
  INPUT_UPDATE,
  INPUT_ORDER_BY,
  appendTransform,
  applyInputTransform,
} from '../inputTypes';

export const INPUT_CREATE_CONNECT_ONE = 'createConnectOne';
export const INPUT_CREATE_CONNECT_MANY = 'createConnectMany';

export const RelationScheme = `directive @relation(field:String="_id", fieldType:String="ObjectID" ) on FIELD_DEFINITION`;

export default queryExecutor =>
  class RelationDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field, { objectType }) {
      const { _typeMap: SchemaTypes } = this.schema;
      const { field: relationField } = this.args;

      this.mmObjectType = objectType;
      this.mmInputTypes = new InputTypes({ SchemaTypes });
      this.mmInputTypes.registerKind(
        INPUT_CREATE_CONNECT_ONE,
        this._createInputOne
      );
      this.mmInputTypes.registerKind(
        INPUT_CREATE_CONNECT_MANY,
        this._createInputMany
      );

      this.mmLastType = getLastType(field.type);
      this.mmIsMany = hasQLListType(field.type);
      this.mmStoreField = getRelationFieldName(
        this.mmLastType.name,
        relationField,
        this.mmIsMany
      );

      appendTransform(field, TRANSFORM_TO_INPUT, {
        [INPUT_ORDER_BY]: field => [],
        [INPUT_CREATE]: this.mmIsMany
          ? this._transformToInputCreateMany
          : this._transformToInputCreateOne,
        [INPUT_UPDATE]: this.mmIsMany
          ? this._transformToInputCreateMany
          : this._transformToInputCreateOne,
        [INPUT_WHERE]: this._transformToInputWhere,
      });
      field.mmOnSchemaInit = this._onSchemaInit;

      field.resolve = this.mmIsMany
        ? this._resolveMany(field)
        : this._resolveSingle(field);
    }

    _createInputOne = (name, initialType, target) => {
      let newType = new GraphQLInputObjectType({
        name,
        fields: {
          create: {
            name: 'create',
            type: this.mmInputTypes.get(initialType, INPUT_CREATE),
          },
          connect: {
            name: 'connect',
            type: this.mmInputTypes.get(initialType, INPUT_WHERE_UNIQUE),
          },
        },
      });
      newType.getFields();
      return newType;
    };

    _createInputMany = (name, initialType, target) => {
      let newType = new GraphQLInputObjectType({
        name,
        fields: {
          create: {
            name: 'create',
            type: new GraphQLList(
              this.mmInputTypes.get(initialType, INPUT_CREATE)
            ),
          },
          connect: {
            name: 'connect',
            type: new GraphQLList(
              this.mmInputTypes.get(initialType, INPUT_WHERE_UNIQUE)
            ),
          },
        },
      });
      newType.getFields();
      return newType;
    };

    _transformToInputWhere = field => {
      const { field: relationField } = this.args;
      let {
        mmLastType: lastType,
        mmIsMany: isMany,
        mmStoreField: storeField,
      } = this;

      let collection = lastType.name;
      let inputType = this.mmInputTypes.get(lastType, 'where');
      let modifiers = isMany ? ['some', 'none'] : [''];
      let fields = [];
      modifiers.forEach(modifier => {
        let fieldName = field.name;
        if (modifier != '') {
          fieldName = `${field.name}_${modifier}`;
        }
        fields.push({
          name: fieldName,
          type: inputType,
          mmTransform: async params => {
            params = params[field.name];
            let value = await queryExecutor({
              type: DISTINCT,
              collection,
              selector: await applyInputTransform(params, inputType),
              options: {
                key: relationField,
              },
            });
            // if (!isMany) {
            value = { $in: value };
            // }
            return { [storeField]: value };
          },
        });
      });
      return fields;
    };

    _transformToInputCreateMany = field => {
      let { mmStoreField: storeField } = this;

      let type = this.mmInputTypes.get(
        getLastType(field.type),
        INPUT_CREATE_CONNECT_MANY
      );
      return [
        {
          name: field.name,
          type,
          mmTransform: async params => {
            let input = params[field.name];
            let ids = [];
            if (input.create) {
              ////Create
              let docs = (await applyInputTransform(input, type)).create;
              let create_ids = await this._insertManyQuery({
                docs,
              });
              ids = [...ids, ...create_ids];
            }
            if (input.connect) {
              ////Connect
              let selector = (await applyInputTransform(input, type)).connect;
              selector = { $or: selector };
              let connect_ids = await this._distinctQuery({ selector });
              ids = [...ids, ...connect_ids];
            }
            return { [storeField]: ids };
          },
        },
      ];
    };

    _transformToInputCreateOne = field => {
      let { mmStoreField: storeField } = this;

      let type = this.mmInputTypes.get(
        getLastType(field.type),
        INPUT_CREATE_CONNECT_ONE
      );
      return [
        {
          name: field.name,
          type,
          mmTransform: async params => {
            let input = params[field.name];
            ////Create and Connect
            if (input.create && input.connect) {
              throw new UserInputError(
                `You should return only one document for singular relation.`
              );
            } else if (input.connect) {
              ////Connect
              let selector = (await applyInputTransform(input, type)).connect;
              let ids = await this._distinctQuery({
                selector,
              });
              if (ids.length == 0) {
                throw new UserInputError(
                  `No records found for selector - ${JSON.stringify(selector)}`
                );
              }
              return { [storeField]: _.head(ids) };
            } else if (input.create) {
              ////Create
              let doc = (await applyInputTransform(input, type)).create;
              let id = await this._insertOneQuery({
                doc,
              });
              return { [storeField]: id };
            } else {
              ////Nothing
              return {};
            }
          },
        },
      ];
    };

    _onSchemaInit = field => {
      let { mmLastType: lastType, mmIsMany: isMany } = this;

      if (isMany) {
        let whereType = this.mmInputTypes.get(lastType, 'where');
        let orderByType = this.mmInputTypes.get(lastType, 'orderBy');

        field.args = allQueryArgs({
          whereType,
          orderByType,
        });

        this._addMetaField(field);
      }
    };

    _resolveSingle = field => async (parent, args, context, info) => {
      const { field: relationField } = this.args;
      let {
        mmLastType: lastType,
        mmIsMany: isMany,
        mmStoreField: storeField,
      } = this;

      let value = parent[storeField];
      let selector = {
        [relationField]: value,
      };

      return queryExecutor({
        type: FIND_ONE,
        collection: lastType.name,
        selector: { [relationField]: value },
        options: { skip: args.skip, limit: args.first },
        context,
      });
    };

    _resolveMany = field => async (parent, args, context, info) => {
      const { field: relationField } = this.args;
      let {
        mmLastType: lastType,
        mmIsMany: isMany,
        mmStoreField: storeField,
      } = this;

      let whereType = this.mmInputTypes.get(lastType, 'where');

      let value = parent[storeField];
      if (_.isArray(value)) {
        value = { $in: value };
      }
      let selector = {
        ...(await applyInputTransform(args.where, whereType)),
        [relationField]: value,
      };
      return queryExecutor({
        type: FIND,
        collection: lastType.name,
        selector,
        options: { skip: args.skip, limit: args.first },
        context,
      });
    };

    _addMetaField = field => {
      const { field: relationField } = this.args;
      let {
        mmLastType: lastType,
        mmIsMany: isMany,
        mmStoreField: storeField,
      } = this;
      const { _typeMap: SchemaTypes } = this.schema;

      let whereType = this.mmInputTypes.get(lastType, 'where');
      let orderByType = this.mmInputTypes.get(lastType, 'orderBy');

      let metaName = `_${field.name}Meta`;
      this.mmObjectType._fields[metaName] = {
        name: metaName,
        skipFilter: true,
        skipCreate: true,
        isDeprecated: false,
        args: allQueryArgs({
          whereType,
          orderByType,
        }),
        type: SchemaTypes._QueryMeta,
        resolve: async (parent, args, context, info) => {
          let value = parent[storeField];
          if (_.isArray(value)) {
            value = { $in: value };
          }
          let selector = {
            ...(await applyInputTransform(args.where, whereType)),
            [relationField]: value,
          };
          return {
            count: queryExecutor({
              type: COUNT,
              collection: lastType.name,
              selector,
              options: { skip: args.skip, limit: args.first },
              context,
            }),
          };
        },
        [TRANSFORM_TO_INPUT]: {
          [INPUT_CREATE]: () => [],
          [INPUT_WHERE]: () => [],
          [INPUT_ORDER_BY]: () => [],
        },
      };
    };

    _distinctQuery = async ({ selector }) => {
      const { field: relationField } = this.args;
      let { mmLastType: lastType } = this;
      let collection = lastType.name;

      return queryExecutor({
        type: DISTINCT,
        collection,
        selector,
        options: {
          key: relationField,
        },
      });
    };

    _insertOneQuery = async ({ doc }) => {
      const { field: relationField } = this.args;
      let { mmLastType: lastType } = this;
      let collection = lastType.name;

      return queryExecutor({
        type: INSERT_ONE,
        collection,
        doc,
      }).then(res => res[relationField]);
    };

    _insertManyQuery = async ({ docs }) => {
      const { field: relationField } = this.args;
      let { mmLastType: lastType } = this;
      let collection = lastType.name;

      return queryExecutor({
        type: INSERT_MANY,
        collection,
        docs,
      }).then(res => res.map(item => item[relationField]));
    };
  };
