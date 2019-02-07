import {
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { UserInputError } from 'apollo-server';

import * as _ from 'lodash';

import { allQueryArgs, getDirective, getRelationFieldName } from '../utils';

import {
  DELETE_ONE,
  DISTINCT,
  FIND_IDS,
  INSERT_MANY,
  INSERT_ONE,
} from '../queryExecutor';

import InputTypes from '../inputTypes';
import TypeWrap from '../typeWrap';
import {
  appendTransform,
  applyInputTransform,
  reduceTransforms,
} from '../inputTypes/utils';
import * as HANDLER from '../inputTypes/handlers';
import * as KIND from '../inputTypes/kinds';
import * as Transforms from '../inputTypes/transforms';
import { DBRef } from 'mongodb';

export const INPUT_CREATE_ONE_RELATION = 'createOneRelation';
export const INPUT_CREATE_MANY_RELATION = 'createManyRelation';
export const INPUT_UPDATE_ONE_RELATION = 'updateOneRelation';
export const INPUT_UPDATE_MANY_RELATION = 'updateManyRelation';
export const INPUT_UPDATE_ONE_REQUIRED_RELATION = 'updateOneRequiredRelation';
export const INPUT_UPDATE_MANY_REQUIRED_RELATION = 'updateManyRequiredRelation';
export const INPUT_UPDATE_MANY_RELATION_UPDATE = 'updateManyRelationUpdateMany';
export const INPUT_UPDATE_MANY_REQUIRED_RELATION_UPDATE =
  'updateManyRequiredRelationUpdateMany';

export const RelationScheme = `directive @relation(field:String="_id", storeField:String=null ) on FIELD_DEFINITION`;

const dbRef = dbRef => dbRef.toJSON();

export default queryExecutor =>
  class RelationDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field, { objectType }) {
      const { field: relationField, storeField } = this.args;
      let fieldTypeWrap = new TypeWrap(field.type);
      let isAbstract = fieldTypeWrap.realType().mmAbstract;
      if (
        !getDirective(fieldTypeWrap.realType(), 'model') &&
        !(
          fieldTypeWrap.isInherited() &&
          getDirective(fieldTypeWrap.interfaceType(), 'model')
        ) &&
        !isAbstract
      ) {
        throw `Relation field type should be defined with Model directive. (Field '${
          field.name
        }' of type '${fieldTypeWrap.realType().name}')`;
      }

      this.mmObjectType = objectType;
      this.mmFieldTypeWrap = fieldTypeWrap;
      this.mmRelationField = relationField;
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

    _transformToInputWhere = ({ field }) => {
      const { field: relationField } = this.args;
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
          mmTransform: async (params, context) => {
            params = params[fieldName];
            let value = await queryExecutor({
              type: DISTINCT,
              collection,
              context,
              selector: await applyInputTransform(context)(params, inputType),
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

    _validateInput = (type, isMany) => params => {
      let input = _.head(Object.values(params));
      if (!isMany) {
        if (Object.keys(input) > 1) {
          throw new UserInputError(
            `You should not fill multiple fields in ${type.name} type`
          );
        } else if (Object.keys(input) === 0) {
          throw new UserInputError(
            `You should fill any field in ${type.name} type`
          );
        }
      } else {
        if (
          (input.disconnect || input.delete) &&
          _.difference(Object.keys(input), ['delete', 'disconnect']).length > 0
        ) {
          throw new UserInputError(`Wrong input in ${type.name} type`);
        }
      }
      return params;
    };

    _transformToInputCreateUpdate = ({ field, kind, inputTypes }) => {
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
            this._validateInput(type, fieldTypeWrap.isMany()),
            Transforms.applyNestedTransform(type),
            fieldTypeWrap.isMany()
              ? this._transformInputMany(isCreate)
              : this._transformInputOne(isCreate),
          ]),
        },
      ];
    };

    _transformInputOne = isCreate => async (params, resolverArgs) => {
      let { parent, context } = resolverArgs;
      let { mmStoreField: storeField, mmRelationField: relationField } = this;
      let input = _.head(Object.values(params));
      let collection = this.mmCollectionName;
      if (input.connect) {
        ////Connect
        let selector = input.connect;
        // console.log(selector);
        if (this.isAbstract) {
          collection = selector.mmCollectionName;
          delete selector.mmCollectionName;
        }
        let ids = await this._distinctQuery({
          collection,
          selector,
          context,
        });
        if (ids.length === 0) {
          throw new UserInputError(
            `No records found for selector - ${JSON.stringify(selector)}`
          );
        }
        let id = this.isAbstract
          ? new DBRef(collection, _.head(ids))
          : _.head(ids);
        return { [storeField]: id };
      } else if (input.create) {
        ////Create
        let doc = input.create;
        if (this.isAbstract) {
          let { mmCollectionName: collection, ...doc } = doc;
        }
        let id = await this._insertOneQuery({
          doc,
          collection,
          context,
        });
        id = this.isAbstract ? new DBRef(collection, id) : id;
        return { [storeField]: id };
      } else if (input.disconnect) {
        ////Disconnect
        return {
          [storeField]: { $mmUnset: 1 },
        };
      } else if (input.delete) {
        collection = this.isAbstract
          ? input.delete.mmCollectionName
          : collection;
        return {
          [storeField]: {
            $mmDeleteSingleRelation: { collection, relationField },
          },
        };
      }
    };

    _transformInputMany = isCreate => async (params, resolverArgs) => {
      let { mmStoreField: storeField, mmCollectionName: collection } = this;
      let { parent, context } = resolverArgs;
      let input = _.head(Object.values(params));

      let ids = [];

      if (input.disconnect || input.delete) {
        if (input.disconnect) {
          if (this.isAbstract) {
            let collections = input.disconnect.reduce((colls, d) => {
              let { mmCollectionName, ...disconnect } = d;
              colls[mmCollectionName]
                ? colls[mmCollectionName].push(disconnect)
                : (colls[mmCollectionName] = [disconnect]);
            });
            Object.entries(collections).forEach(async ([coll, selector]) => {
              ids = [
                ...ids,
                ...(await this._distinctQuery({
                  selector,
                  collection: coll,
                  context,
                })),
              ];
            });
          } else {
            ////Disconnect
            let selector = { $and: input.disconnect };
            ids = await this._distinctQuery({
              selector,
              context,
            });
          }

          if (ids.length === 0) {
            throw new UserInputError(`No records found for where clause`);
          }
        }
        if (input.delete) {
          let delete_ids;
          if (this.isAbstract) {
            let collections = input.delete.reduce((colls, d) => {
              let { mmCollectionName, ...del } = d;
              colls[mmCollectionName]
                ? colls[mmCollectionName].push(del)
                : (colls[mmCollectionName] = [del]);
            });
            Object.entries(collections).forEach(async ([coll, selectors]) => {
              delete_ids = [
                ...delete_ids,
                ...selectors.map(selector =>
                  this._deleteOneQuery({ collection: coll, selector, context })
                ),
              ];
            });
          } else {
            delete_ids = input.delete.map(selector =>
              this._deleteOneQuery({ selector, context })
            );
          }
          delete_ids = await Promise.all(delete_ids);
          delete_ids = delete_ids.filter(id => id);
          ids = [...ids, ...delete_ids];
        }
        if (this.isAbstract) {
          return { [storeField]: { $mmPull: { $id: { $in: ids } } } };
        }
        return { [storeField]: { $mmPullAll: ids } };
      } else {
        if (input.connect) {
          ////Connect
          if (this.isAbstract) {
            let collections = input.connect.reduce((colls, c) => {
              let { mmCollectionName, ...conn } = c;
              colls[mmCollectionName]
                ? colls[mmCollectionName].push(conn)
                : (colls[mmCollectionName] = [conn]);
            });
            Object.entries(collections).forEach(async ([coll, connects]) => {
              ids = [
                ...ids,
                ...connects.map(
                  async selector =>
                    await this._distinctQuery({
                      selector,
                      collection: coll,
                      context,
                    }).then(ids => ids.map(id => new DBRef(coll, id)))
                ),
              ];
            });
          } else {
            let selector = { $or: input.connect };
            ids = await this._distinctQuery({
              selector,
              context,
            });
          }

          // if (ids.length === 0) {
          //   throw new UserInputError(
          //     `No records found for selector - ${JSON.stringify(selector)}`
          //   );
          // }
        }
        if (input.create) {
          ////Create
          let docs = input.create;
          let create_ids = [];
          if (this.isAbstract) {
            let collections = input.create.reduce((colls, c) => {
              let { mmCollectionName, ...create } = c;
              colls[mmCollectionName]
                ? colls[mmCollectionName].push(create)
                : (colls[mmCollectionName] = [conn]);
            });
            Object.entries(collections).forEach(async ([coll, creates]) => {
              let _ids = [];
              if (creates.length > 1) {
                _ids = await this._insertManyQuery({
                  docs: creates,
                  context,
                  collection: coll,
                }).then(ids => ids.map(id => new DBRef(coll, id)));
              } else {
                _ids = await this._insertOneQuery({
                  doc: creates[0],
                  context,
                  collection: coll,
                }).then(id => [new DBRef(coll, id)]);
              }
              create_ids = [...create_ids, ..._ids];
            });
          } else {
            create_ids = await this._insertManyQuery({
              docs,
              context,
            });
          }

          ids = [...ids, ...create_ids];
        }
        if (isCreate) {
          return { [storeField]: ids}
        }else {
          return { [storeField]: { $mmPushAll: ids } };
        }
        
      }
    };

    _onSchemaBuild = ({ field }) => {
      let fieldTypeWrap = new TypeWrap(field.type);
      this.mmCollectionName = fieldTypeWrap.realType().mmCollectionName;
      this.mmInterfaceModifier = {};
      this.isAbstract = fieldTypeWrap.isAbstract();
      //Collection name and interface modifier
      if (fieldTypeWrap.isInherited()) {
        let { mmDiscriminator } = fieldTypeWrap.realType();
        let { mmDiscriminatorField } = fieldTypeWrap.interfaceType();
        this.mmInterfaceModifier = {
          [mmDiscriminatorField]: mmDiscriminator,
        };
      }
    };

    _onSchemaInit = ({ field }) => {
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

        if (!fieldTypeWrap.isAbstract()) {
          this._addConnectionField(field);
        }
      }
    };

    _resolveSingle = field => async (parent, args, context, info) => {
      const { field: relationField } = this.args;
      let {
        mmFieldTypeWrap: fieldTypeWrap,
        mmCollectionName: collection,
        mmStoreField: storeField,
        mmInterfaceModifier,
      } = this;
      let selector = {
        ...mmInterfaceModifier,
      };
      let value = parent[storeField];
      if (fieldTypeWrap.isAbstract()) {
        let { $id: id, $ref: c } = dbRef(value);
        collection = c;
        value = id;
      }
      if (!value) return null;

      return queryExecutor({
        type: FIND_IDS,
        collection,
        selector,
        options: {
          selectorField: relationField,
          ids: [value],
        },
        context,
      }).then(res => {
        let data = _.head(res);
        data['mmCollection'] = collection;
        return data;
      });
    };

    _resolveMany = field => async (parent, args, context, info) => {
      const { field: relationField } = this.args;
      let {
        mmFieldTypeWrap: fieldTypeWrap,
        mmCollectionName: collection,
        mmObjectType: modelType,
        mmStoreField: storeField,
        mmInterfaceModifier,
      } = this;

      let whereType = InputTypes.get(
        fieldTypeWrap.realType(),
        fieldTypeWrap.isInterface() ? KIND.WHERE_INTERFACE : KIND.WHERE
      );

      let value = parent[storeField];
      if (!value) return fieldTypeWrap.isRequired() ? [] : null;
      let selector = {};
      if (!fieldTypeWrap.isAbstract()) {
        selector = await applyInputTransform({ parent, context })(
          args.where,
          whereType
        );
      }

      if (fieldTypeWrap.isInterface()) {
        selector = Transforms.validateAndTransformInterfaceInput(whereType)({
          selector,
        }).selector;
      }

      selector = {
        ...selector,
        ...mmInterfaceModifier,
      };
      if (args.skip) {
        value = _.drop(value, args.skip);
      }
      if (args.first) {
        value = _.take(value, args.first);
      }

      if (fieldTypeWrap.isAbstract()) {
        let collections = value.reduce((acc, v) => {
          let { $ref: col, $id: id } = v.toJSON();
          acc[col] = !acc[col] ? [id] : [...acc[col], id];
        });

        let queries = Object.entries(collections).map((collection, value) => {
          let options = {
            selectorField: relationField,
            ids: value,
          };
          return this._findIDsQuery({
            collection,
            selector,
            options,
            context,
          }).then(results => {
            return results.map(r => {
              r['mmCollection'] = collection;
              return r;
            });
          });
        });
        return Promise.all(queries).then(results => {
          let data = [];
          results.forEach(r => (data = [...data, ...results]));
          return data;
        });
      } else {
        return this._findIDsQuery({
          collection,
          selector,
          options: {
            selectorField: relationField,
            ids: value,
          },
          context,
        });
      }
    };

    _addConnectionField = field => {
      const { field: relationField } = this.args;
      let {
        mmFieldTypeWrap: fieldTypeWrap,
        mmCollectionName: collection,
        mmStoreField: storeField,
      } = this;
      const { _typeMap: SchemaTypes } = this.schema;

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
          if (Array.isArray(value)) {
            value = { $in: value };
          }
          let selector = {
            $and: [
              await applyInputTransform({ parent, context })(
                args.where,
                whereType
              ),
              { [relationField]: value },
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

    _distinctQuery = async ({ collection, selector, context }) => {
      const { field: relationField } = this.args;
      let {
        mmCollectionName,
        mmStoreField: storeField,
        mmInterfaceModifier,
      } = this;
      selector = { ...selector, ...mmInterfaceModifier };
      collection = collection || mmCollectionName;
      return queryExecutor({
        type: DISTINCT,
        collection,
        selector,
        context,
        options: {
          key: relationField,
        },
      });
    };

    _findIDsQuery = async ({ collection, selector, options, context }) => {
      return queryExecutor({
        type: FIND_IDS,
        collection,
        selector,
        options,
        context,
      });
    };

    _deleteOneQuery = async ({ collection, selector, context }) => {
      const { field: relationField } = this.args;
      let {
        mmCollectionName,
        mmStoreField: storeField,
        mmInterfaceModifier,
      } = this;
      collection = collection || mmCollectionName;
      selector = { ...selector, ...mmInterfaceModifier };

      return queryExecutor({
        type: DELETE_ONE,
        collection,
        selector,
        context,
      }).then(res => (res ? res[relationField] : null));
    };

    _insertOneQuery = async ({ collection, doc, context }) => {
      const { field: relationField } = this.args;
      let {
        mmCollectionName,
        mmStoreField: storeField,
        mmInterfaceModifier,
      } = this;
      doc = { ...doc, ...mmInterfaceModifier };
      collection = collection || mmCollectionName;
      return queryExecutor({
        type: INSERT_ONE,
        collection,
        doc,
        context,
      }).then(res => res[relationField]);
    };

    _insertManyQuery = async ({ collection, docs, context }) => {
      const { field: relationField } = this.args;
      let {
        mmCollectionName,
        mmStoreField: storeField,
        mmInterfaceModifier,
      } = this;
      docs = docs.map(doc => ({ ...doc, ...mmInterfaceModifier }));
      collection = collection || mmCollectionName;
      return queryExecutor({
        type: INSERT_MANY,
        collection,
        docs,
        context,
      }).then(res => res.map(item => item[relationField]));
    };
  };

let createInputTransform = (type, isInterface) =>
  reduceTransforms([
    Transforms.applyNestedTransform(type),
    isInterface ? Transforms.validateAndTransformInterfaceInput(type) : null,
  ]);

const createInput = ({ name, initialType, kind, inputTypes }) => {
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

  let updateType = inputTypes.get(
    initialType,
    typeWrap.isInterface() ? KIND.UPDATE_INTERFACE : KIND.UPDATE
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

  if (
    [INPUT_UPDATE_MANY_RELATION, INPUT_UPDATE_MANY_REQUIRED_RELATION].includes(
      kind
    )
  ) {
    let updateKind = INPUT_UPDATE_MANY_RELATION ? INPUT_UPDATE_MANY_RELATION_UPDATE : INPUT_UPDATE_MANY_REQUIRED_RELATION_UPDATE;
    let updateManyType = inputTypes.get(initialType, updateKind);
    fields.updateMany = {
      name: 'updateMany',
      type: updateManyType,
      mmTransform: createInputTransform(updateManyType, typeWrap.isInterface())
    }
  }else if([
    INPUT_UPDATE_ONE_RELATION,
    INPUT_UPDATE_ONE_REQUIRED_RELATION
  ].includes(kind)) {
    fields.update = {
      name: 'update',
      type: updateType,
      mmTransform: createInputTransform(updateType, typeWrap.isInterface())
    }
  }

  if (
    [
      INPUT_UPDATE_ONE_RELATION,
      INPUT_UPDATE_MANY_RELATION,
      INPUT_UPDATE_MANY_REQUIRED_RELATION,
    ].includes(kind)
  ) {
    fields.disconnect = {
      name: 'disconnect',
      type: whereType,
      mmTransform: createInputTransform(whereType, typeWrap.isInterface()),
    };

    fields.delete = {
      name: 'delete',
      type: whereType,
      mmTransform: createInputTransform(whereType, typeWrap.isInterface()),
    };
  }

  let newType = new GraphQLInputObjectType({
    name,
    fields,
  });
  newType.getFields();
  return newType;
};
const createUpdateManyInput = ({ name, initialType, kind, inputTypes }) => {
  let fields = {};
  let typeWrap = new TypeWrap(initialType);

  let updateType = inputTypes.get(
    initialType,
    typeWrap.isInterface() ? KIND.UPDATE_INTERFACE : KIND.UPDATE
  );

  let whereUniqueType = inputTypes.get(
    initialType,
    typeWrap.isInterface() ? KIND.WHERE_UNIQUE_INTERFACE : KIND.WHERE_UNIQUE
  );
  fields.where = {
    name: 'where',
    type: whereUniqueType,
    mmTransform: createInputTransform(whereUniqueType, typeWrap.isInterface()),
  };

  fields.data = {
    name: 'data',
    type: updateType,
    mmTransform: createInputTransform(updateType, typeWrap.isInterface()),
  };
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
InputTypes.registerKind(
  INPUT_UPDATE_MANY_RELATION_UPDATE,
  createUpdateManyInput
);
InputTypes.registerKind(
  INPUT_UPDATE_MANY_REQUIRED_RELATION_UPDATE,
  createUpdateManyInput
);
