import gql from 'graphql-tag';
import * as _ from 'lodash';
import { SchemaDirectiveVisitor } from 'graphql-tools';

import { allQueryArgs, getRelationFieldName } from '../../utils';

import {
  appendTransform,
  applyInputTransform,
  reduceTransforms,
} from '../../inputTypes/utils';

import { FIND, FIND_IDS, FIND_ONE } from '@apollo-model/mongodb-executor';

import InputTypes from '../../inputTypes';
import TypeWrap from '@apollo-model/type-wrap';
import * as HANDLER from '../../inputTypes/handlers';
import * as KIND from '../../inputTypes/kinds';
import * as Transforms from '../../inputTypes/transforms';
import {
  INPUT_CREATE_MANY_RELATION,
  INPUT_CREATE_ONE_RELATION,
  INPUT_UPDATE_MANY_RELATION,
  INPUT_UPDATE_MANY_REQUIRED_RELATION,
  INPUT_UPDATE_ONE_RELATION,
  INPUT_UPDATE_ONE_REQUIRED_RELATION,
} from './relation';

let queryExecutor = null;
export const setQueryExecutor = q => (queryExecutor = q);

export const typeDef = gql`
  directive @extRelation(
    field: String = "_id"
    storeField: String = null
    many: Boolean = false
  ) on FIELD_DEFINITION
`;

class ExtRelationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field, { objectType }) {
    const { _typeMap: SchemaTypes } = this.schema;
    const { field: relationField, storeField, many } = this.args;
    let fieldTypeWrap = new TypeWrap(field.type);

    this.mmObjectType = objectType;
    this.mmFieldTypeWrap = fieldTypeWrap;
    this.mmRelationField = relationField;
    this.mmStoreField =
      storeField ||
      getRelationFieldName(this.mmObjectType.name, relationField, many);

    appendTransform(field, HANDLER.TRANSFORM_TO_INPUT, {
      [KIND.ORDER_BY]: field => [],
      [KIND.CREATE]: field => [],
      [KIND.UPDATE]: field => [],
      [KIND.WHERE]: field => [],
    });

    field.mmOnSchemaInit = this._onSchemaInit;
    field.mmOnSchemaBuild = this._onSchemaBuild;

    field.resolve = fieldTypeWrap.isMany()
      ? this._resolveMany(field)
      : this._resolveSingle(field);
  }

  _onSchemaInit = ({ field }) => {
    let { mmFieldTypeWrap: fieldTypeWrap } = this;

    if (fieldTypeWrap.isMany()) {
      let whereType = InputTypes.get(
        fieldTypeWrap.realType(),
        fieldTypeWrap.isInterface() ? KIND.WHERE_INTERFACE : KIND.WHERE
      );
      let orderByType = InputTypes.get(fieldTypeWrap.realType(), KIND.ORDER_BY);

      field.args = allQueryArgs({
        whereType,
        orderByType,
      });

      this._addConnectionField(field);
    }
  };

  _onSchemaBuild = ({ field }) => {
    let fieldTypeWrap = new TypeWrap(field.type);

    //Collection name and interface modifier
    if (fieldTypeWrap.interfaceWithDirective('model')) {
      let { mmDiscriminator } = fieldTypeWrap.realType();
      let { mmDiscriminatorField } = fieldTypeWrap.interfaceWithDirective(
        'model'
      );
      this.mmInterfaceModifier = {
        [mmDiscriminatorField]: mmDiscriminator,
      };
    } else {
      this.mmInterfaceModifier = {};
    }
    this.mmCollectionName = fieldTypeWrap.realType().mmCollectionName;
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
    let {
      mmStoreField: storeField,
      mmRelationField: relationField,
      mmCollectionName: collection,
    } = this;
    let input = _.head(Object.values(params));
    if (input.connect) {
      ////Connect
      let selector = input.connect;
      if (this.isAbstract) {
        let { mmCollectionName: collection, ..._selector } = input.connect;
        selector = _selector;
      }

      // console.log(selector);
      let ids = await this._distinctQuery({
        selector,
        context,
      });
      if (ids.length === 0) {
        throw new UserInputError(
          `No records found for selector - ${JSON.stringify(selector)}`
        );
      }
      return {
        [storeField]: {
          $mmConnectExtRelationship: {
            collection,
            selector,
            relationField,
          },
        },
      };
    } else if (input.create) {
      ////Create
      let doc = input.create;
      if (this.isAbstract) {
        let { mmCollectionName: collection, ..._doc } = doc;
        doc = _doc;
      }
      return {
        [storeField]: {
          $mmCreateExtRelationship: {
            collection,
            doc,
            relationField,
          },
        },
      };
    } else if (input.disconnect) {
      let selector = input.disconnect;
      if (this.isAbstract) {
        let { mmCollectionName: collection, _selector } = selector;
        selector = _selector;
      }
      return {
        [storeField]: {
          $mmDisconnectExtRelationship: {
            collection,
            selector,
            relationField,
          },
        },
      };
    } else if (input.delete) {
      if (this.isAbstract) {
        let { mmCollectionName: collection } = input.delete;
      }
      return {
        [storeField]: {
          $mmDeleteExtRelationship: {
            collection,
            relationField,
          },
        },
      };
    }
  };

  _transformInputMany = isCreate => async (params, resolverArgs) => {
    let { mmStoreField: storeField } = this;
    let { parent, context } = resolverArgs;
    let input = _.head(Object.values(params));

    let ids = [];

    if (input.disconnect || input.delete) {
      if (input.disconnect) {
        ////Disconnect
        let selector = { $or: input.disconnect };
        ids = await this._distinctQuery({
          selector,
          context,
        });
        if (ids.length === 0) {
          throw new UserInputError(
            `No records found for selector - ${JSON.stringify(selector)}`
          );
        }
      }
      if (input.delete) {
        let delete_ids = input.delete.map(selector =>
          this._deleteOneQuery({ selector, context })
        );
        delete_ids = await Promise.all(delete_ids);
        delete_ids = delete_ids.filter(id => id);
        ids = [...ids, ...delete_ids];
      }
      return { [storeField]: { $mmPullAll: ids } };
    } else {
      if (input.connect) {
        ////Connect
        let selector = { $or: input.connect };
        ids = await this._distinctQuery({
          selector,
          context,
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
          context,
        });
        ids = [...ids, ...create_ids];
      }
      return { [storeField]: ids };
    }
  };

  _resolveSingle = field => async (parent, args, context, info) => {
    const { field: relationField } = this.args;
    let {
      mmStoreField: storeField,
      mmInterfaceModifier,
      mmObjectType: modelType,
    } = this;

    let value = parent[relationField];
    let selector = {
      [storeField]: value,
      ...mmInterfaceModifier,
    };

    return queryExecutor({
      type: FIND_ONE,
      modelType,
      collection: this.mmCollectionName,
      selector,
      options: {},
      context,
    });
  };

  _resolveMany = field => async (parent, args, context, info) => {
    const { field: relationField } = this.args;
    let {
      mmFieldTypeWrap: fieldTypeWrap,
      mmStoreField: storeField,
      mmObjectType: modelType,
      mmInterfaceModifier,
    } = this;

    let whereType = InputTypes.get(
      fieldTypeWrap.realType(),
      fieldTypeWrap.isInterface() ? KIND.WHERE_INTERFACE : KIND.WHERE
    );

    let value = parent[relationField];
    if (Array.isArray(value)) {
      value = { $in: value };
    }

    let selector = await applyInputTransform({ parent, context })(
      args.where,
      whereType
    );
    if (fieldTypeWrap.isInterface()) {
      selector = Transforms.validateAndTransformInterfaceInput(whereType)({
        selector,
      }).selector;
    }
    if (!_.isEmpty(mmInterfaceModifier)) {
      selector = {
        ...selector,
        ...mmInterfaceModifier,
      };
    } else if (fieldTypeWrap.realType().mmInherit && _.isEmpty(selector)) {
      let ids = value || [];

      return queryExecutor({
        type: FIND_IDS,
        collection: this.mmCollectionName,
        modelType,
        selector,
        options: {
          ids,
          skip: args.skip,
          limit: args.first,
          selectorField: storeField,
        },
        context,
      });
    }
    selector[[storeField]] = value;
    return queryExecutor({
      type: FIND,
      collection: this.mmCollectionName,
      modelType,
      selector,
      options: {
        skip: args.skip,
        limit: args.first,
      },
      context,
    });
  };

  _addConnectionField = field => {
    const { field: relationField } = this.args;
    let { mmFieldTypeWrap: fieldTypeWrap, mmStoreField: storeField } = this;
    const { _typeMap: SchemaTypes } = this.schema;

    let whereType = InputTypes.get(fieldTypeWrap.realType(), KIND.WHERE);
    let orderByType = InputTypes.get(fieldTypeWrap.realType(), KIND.ORDER_BY);

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
        let value = parent[relationField];
        if (Array.isArray(value)) {
          value = { $in: value };
        }
        let selector = {
          $and: [
            await applyInputTransform({ parent, context })(
              args.where,
              whereType
            ),
            { [storeField]: value },
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
}

export const schemaDirectives = {
  extRelation: ExtRelationDirective,
};
