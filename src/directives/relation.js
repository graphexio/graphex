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
      // let isAbstract = fieldTypeWrap.realType().mmAbstract;
      // issue if interface defined after relation
      let isAbstract = getDirective(fieldTypeWrap.realType(), 'abstract');

      if (
        !getDirective(fieldTypeWrap.realType(), 'model') &&
        !(
          fieldTypeWrap.isInherited() &&
          getDirective(fieldTypeWrap.interfaceType(), 'model')
        ) &&
        !isAbstract
      ) {
        throw `Relation field type should be defined with Model directive or Abstract interface. (Field '${
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

    _groupBy = (input, field) =>
      input.reduce((colls, c) => {
        let parameter = c[field];
        let value = _.omit(c, field);
        return colls[parameter]
          ? {
              ...colls,
              [parameter]: [...colls[parameter], value],
            }
          : {
              ...colls,
              [parameter]: [value],
            };
      }, {});

    _groupByCollection = input => this._groupBy(input, 'mmCollectionName');

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

      let disconnect_ids = [];
      let delete_ids = [];
      let connect_ids = [];
      let create_ids = [];

      if (input.disconnect || input.delete) {
        if (input.disconnect) {
          if (this.isAbstract) {
            disconnect_ids = Promise.all(
              _.toPairs(this._groupByCollection(input.disconnect)).map(
                ([collection, disconnects]) =>
                  this._distinctQuery({
                    selector: { $or: disconnects },
                    collection,
                    context,
                  }).then(res => res.map(id => new DBRef(collection, id)))
              )
            ).then(res => _.flatten(res));
          } else {
            ////Disconnect
            let selector = { $or: input.disconnect };
            disconnect_ids = this._distinctQuery({
              selector,
              context,
            });
          }

          // if (disconnect_ids.length === 0) {
          //   throw new UserInputError(`No records found for where clause`);
          // }
        }
        if (input.delete) {
          if (this.isAbstract) {
            delete_ids = Promise.all(
              _.flatten(
                _.toPairs(this._groupByCollection(input.delete)).map(
                  ([collection, deletes]) =>
                    deletes.map(selector =>
                      this._deleteOneQuery({
                        collection,
                        selector,
                        context,
                      }).then(id => new DBRef(collection, id))
                    )
                )
              )
            );
          } else {
            delete_ids = input.delete.map(selector =>
              this._deleteOneQuery({ selector, context })
            );
          }
        }
        disconnect_ids = await disconnect_ids;
        delete_ids = await delete_ids;

        delete_ids = delete_ids.filter(id => id);
        let ids = [...disconnect_ids, ...delete_ids];

        // if (this.isAbstract) {
        //   return { [storeField]: { $mmPull: { $id: { $in: ids } } } };
        // }
        return { [storeField]: { $mmPullAll: ids } };
      } else {
        if (input.connect) {
          ////Connect
          if (this.isAbstract) {
            connect_ids = Promise.all(
              _.toPairs(this._groupByCollection(input.connect)).map(
                ([collection, connects]) =>
                  this._distinctQuery({
                    selector: { $or: connects },
                    collection,
                    context,
                  }).then(ids => ids.map(id => new DBRef(collection, id)))
              )
            ).then(res => _.flatten(res));
          } else {
            let selector = { $or: input.connect };
            connect_ids = this._distinctQuery({
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
          if (this.isAbstract) {
            create_ids = Promise.all(
              _.toPairs(this._groupByCollection(input.create)).map(
                ([collection, creates]) =>
                  ////if creates.length>0
                  this._insertManyQuery({
                    docs: creates,
                    context,
                    collection,
                  }).then(ids => ids.map(id => new DBRef(collection, id)))
              )
            ).then(res => _.flatten(res));
            // } else {
            //   _ids = await this._insertOneQuery({
            //     doc: creates[0],
            //     context,
            //     collection: coll,
            //   }).then(id => [new DBRef(coll, id)]);
            // }
          } else {
            create_ids = this._insertManyQuery({
              docs,
              context,
            });
          }
        }
        connect_ids = await connect_ids;
        create_ids = await create_ids;
        let ids = [...connect_ids, ...create_ids];

        if (isCreate) {
          return { [storeField]: ids };
        } else {
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
        if (data) {
          data['mmCollection'] = collection;
        }
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
      if (this.isAbstract) {
        let collections = this._groupBy(value.map(v => v.toJSON()), '$ref');

        return Promise.all(
          _.toPairs(collections).map(([collection, ids]) =>
            this._findIDsQuery({
              collection,
              selector,
              options: {
                selectorField: relationField,
                ids: ids.map(id => id.$id),
              },
              context,
            }).then(results =>
              results.map(r => ({
                ...r,
                mmCollectionName: collection,
              }))
            )
          )
        ).then(res => _.flatten(res));
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
    let updateKind = INPUT_UPDATE_MANY_RELATION
      ? INPUT_UPDATE_MANY_RELATION_UPDATE
      : INPUT_UPDATE_MANY_REQUIRED_RELATION_UPDATE;
    let updateManyType = inputTypes.get(initialType, updateKind);
    fields.updateMany = {
      name: 'updateMany',
      type: updateManyType,
      mmTransform: createInputTransform(updateManyType, typeWrap.isInterface()),
    };
  } else if (
    [INPUT_UPDATE_ONE_RELATION, INPUT_UPDATE_ONE_REQUIRED_RELATION].includes(
      kind
    )
  ) {
    fields.update = {
      name: 'update',
      type: updateType,
      mmTransform: createInputTransform(updateType, typeWrap.isInterface()),
    };
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
      type: whereType,
      mmTransform: createInputTransform(whereType, typeWrap.isInterface()),
    };
  }

  if ([INPUT_UPDATE_ONE_RELATION].includes(kind)) {
    fields.disconnect = {
      name: 'disconnect',
      type: GraphQLBoolean,
      mmTransform: () => {
        throw new Error('Disconnect is not supported for single relation yet');
      },
    };

    fields.delete = {
      name: 'delete',
      type: GraphQLBoolean,
      mmTransform: () => {
        throw new Error('Delete is not supported for single relation yet');
      },
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
