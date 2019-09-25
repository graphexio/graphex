import { GraphQLBoolean, GraphQLInputObjectType, GraphQLList } from 'graphql';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { UserInputError } from 'apollo-server';

import * as _ from 'lodash';

import { allQueryArgs, getDirective, lowercaseFirstLetter } from '../../utils';

import {
  DELETE_ONE,
  DISTINCT,
  FIND_IDS,
  FIND_ONE,
  INSERT_MANY,
  INSERT_ONE,
  UPDATE_ONE,
} from '@apollo-model/mongodb-executor';

import InputTypes from '../../inputTypes';
import TypeWrap from '@apollo-model/type-wrap';
import {
  appendTransform,
  applyInputTransform,
  reduceTransforms,
} from '../../inputTypes/utils';
import * as HANDLER from '../../inputTypes/handlers';
import { INPUT_TYPE_KIND } from '../../inputTypes/kinds';
import * as Transforms from '../../inputTypes/transforms';

export const INPUT_CREATE_ONE_EMBEDDED = 'createOneEmbedded';
export const INPUT_CREATE_MANY_EMBEDDED = 'createManyEmbedded';
export const INPUT_UPDATE_ONE_EMBEDDED = 'updateOneEmbedded';
export const INPUT_UPDATE_MANY_EMBEDDED = 'updateManyEmbedded';
export const INPUT_UPDATE_ONE_REQUIRED_EMBEDDED = 'updateOneRequiredEmbedded';
export const INPUT_UPDATE_MANY_REQUIRED_EMBEDDED = 'updateManyRequiredEmbedded';

export const typeDef = `directive @embedded on OBJECT`;

class EmbeddedDirective extends SchemaDirectiveVisitor {
  visitObject(object) {
    const { _typeMap: SchemaTypes } = this.schema;
    Object.values(SchemaTypes)
      .filter(type => type.mmCollectionName)
      .forEach(type => {
        type._fields.forEach(field => {
          let fieldTypeWrap = new TypeWrap(field.type);
          if (fieldTypeWrap.realType() === object) {
            this.visitFieldDefinition(field, { object });
          }
        });
      });
  }

  visitFieldDefinition(field, { objectType }) {
    let fieldTypeWrap = new TypeWrap(field.type);
    if (
      !(
        getDirective(fieldTypeWrap.realType(), 'embedded') ||
        fieldTypeWrap.interfaceWithDirective('embedded')
      )
    ) {
      throw `Embedded field type should be defined with embedded directive. (Field '${
        field.name
      }' of type '${fieldTypeWrap.realType().name}')`;
    }

    appendTransform(field, HANDLER.TRANSFORM_TO_INPUT, {
      [INPUT_TYPE_KIND.ORDER_BY]: () => [],
      [INPUT_TYPE_KIND.CREATE]: this._transformToInputCreateUpdate(field),
      [INPUT_TYPE_KIND.UPDATE]: this._transformToInputCreateUpdate(field),
      [INPUT_TYPE_KIND.WHERE]: this._transformToInputWhere(field),
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
    let inputType = InputTypes.get(
      fieldTypeWrap.realType(),
      INPUT_TYPE_KIND.WHERE
    );
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
    let isCreate = kind === INPUT_TYPE_KIND.CREATE;

    let type = inputTypes.get(
      fieldTypeWrap.realType(),
      fieldTypeWrap.isMany()
        ? isCreate
          ? INPUT_CREATE_MANY_EMBEDDED
          : fieldTypeWrap.isRequired()
          ? INPUT_UPDATE_MANY_REQUIRED_EMBEDDED
          : INPUT_UPDATE_MANY_EMBEDDED
        : isCreate
        ? INPUT_CREATE_ONE_EMBEDDED
        : fieldTypeWrap.isRequired()
        ? INPUT_UPDATE_ONE_REQUIRED_EMBEDDED
        : INPUT_UPDATE_ONE_EMBEDDED
    );
    return [
      {
        name: field.name,
        type,
        mmTransform: reduceTransforms([
          this._validateInput(type, fieldTypeWrap.isMany()),
          Transforms.applyNestedTransform(type),
          fieldTypeWrap.isMany()
            ? this._transformInputMany
            : this._transformInputOne,
        ]),
      },
    ];
  };

  _transformInputOne = field => async (params, resolverArgs) => {
    let input = _.head(Object.values(params));
    if (input.create || input.update) {
      return { [field.name]: input.create };
    } else if (input.delete) {
      return _.mapValues(params, val => ({ $mmUnset: true }));
    }
  };

  _transformInputMany = field => async (params, resolverArgs) => {
    let input = _.head(Object.values(params));
    if (input.delete) {
      return {
        [field.name]: { $mmPull: input.where },
      };
    } else {
      if (input.create || input.update) {
        ////Create
        let docs = input.create;
        return { [field.name]: { $mmPushAll: docs } };
      }
    }
  };

  _onSchemaInit = ({ field }) => {
    let fieldTypeWrap = new TypeWrap(field.type);

    ///Args and connection field
    if (fieldTypeWrap.isMany()) {
      let whereType = InputTypes.get(
        fieldTypeWrap.realType(),
        fieldTypeWrap.isInterface()
          ? INPUT_TYPE_KIND.WHERE_INTERFACE
          : INPUT_TYPE_KIND.WHERE
      );
      let orderByType = InputTypes.get(
        fieldTypeWrap.realType(),
        INPUT_TYPE_KIND.ORDER_BY
      );

      field.args = allQueryArgs({
        whereType,
      });
    }
  };

  _resolveSingle = field => async (parent, args, context, info) => {
    return parent[field.name];
  };

  _resolveMany = field => async (parent, args, context, info) => {
    return parent[field.name];
  };
}

let createInputTransform = (type, isInterface) =>
  reduceTransforms([
    Transforms.applyNestedTransform(type),
    isInterface ? Transforms.validateAndTransformInterfaceInput(type) : null,
  ]);

const createInput = ({ name, initialType, kind, inputTypes }) => {
  let typeWrap = new TypeWrap(initialType);

  let createType = inputTypes.get(
    initialType,
    typeWrap.isInterface()
      ? INPUT_TYPE_KIND.CREATE_INTERFACE
      : INPUT_TYPE_KIND.CREATE
  );
  let updateType = inputTypes.get(
    initialType,
    typeWrap.isInterface()
      ? INPUT_TYPE_KIND.CREATE_INTERFACE
      : INPUT_TYPE_KIND.CREATE
  );

  let deleteType = inputTypes.get(
    initialType,
    typeWrap.isInterface()
      ? INPUT_TYPE_KIND.DELETE_INTERFACE
      : INPUT_TYPE_KIND.DELETE
  );

  let whereType = inputTypes.get(
    initialType,
    typeWrap.isInterface()
      ? INPUT_TYPE_KIND.WHERE_INTERFACE
      : INPUT_TYPE_KIND.WHERE
  );

  let whereField = {
    name: 'where',
    type: whereType,
    mmTransform: createInputTransform(whereType, typeWrap.isInterface()),
  };

  let createField = {
    name: 'create',
    type: createType,
    mmTransform: createInputTransform(createType, typeWrap.isInterface()),
  };

  let updateField = {
    name: 'update',
    type: updateType,
    mmTransform: createInputTransform(updateType, typeWrap.isInterface()),
  };

  let deleteField = {
    name: 'delete',
    type: GraphQLBoolean,
    mmTransform: createInputTransform(updateType, typeWrap.isInterface()),
  };

  if (
    [
      INPUT_CREATE_MANY_EMBEDDED,
      INPUT_UPDATE_MANY_EMBEDDED,
      INPUT_UPDATE_MANY_REQUIRED_EMBEDDED,
    ].includes(kind)
  ) {
    createType = new GraphQLList(createType);
    updateType = new GraphQLList(updateType);
    deleteType = new GraphQLList(deleteType);
  }

  let fields = new Set();
  if (
    [
      INPUT_CREATE_ONE_EMBEDDED,
      INPUT_CREATE_MANY_EMBEDDED,
      INPUT_UPDATE_ONE_EMBEDDED,
      INPUT_UPDATE_MANY_EMBEDDED,
      INPUT_UPDATE_ONE_REQUIRED_EMBEDDED,
      INPUT_UPDATE_MANY_REQUIRED_EMBEDDED,
    ].includes(kind)
  ) {
    fields.add(createField);
  }
  if (
    [
      INPUT_UPDATE_ONE_EMBEDDED,
      INPUT_UPDATE_MANY_EMBEDDED,
      INPUT_UPDATE_ONE_REQUIRED_EMBEDDED,
      INPUT_UPDATE_MANY_REQUIRED_EMBEDDED,
    ].includes(kind)
  ) {
    fields.add(updateField);
    fields.add(deleteField);
  }

  if (INPUT_UPDATE_MANY_EMBEDDED)
    if (
      [
        INPUT_UPDATE_MANY_EMBEDDED,
        INPUT_UPDATE_MANY_REQUIRED_EMBEDDED,
      ].includes(kind)
    ) {
    }

  let newType = new GraphQLInputObjectType({
    name,
    fields,
  });
  newType.getFields();
  return newType;
};

InputTypes.registerKind(INPUT_CREATE_ONE_EMBEDDED, createInput);
InputTypes.registerKind(INPUT_CREATE_MANY_EMBEDDED, createInput);
InputTypes.registerKind(INPUT_UPDATE_ONE_EMBEDDED, createInput);
InputTypes.registerKind(INPUT_UPDATE_MANY_EMBEDDED, createInput);
InputTypes.registerKind(INPUT_UPDATE_ONE_REQUIRED_EMBEDDED, createInput);
InputTypes.registerKind(INPUT_UPDATE_MANY_REQUIRED_EMBEDDED, createInput);

export const schemaDirectives = {
  embedded: EmbeddedDirective,
};
