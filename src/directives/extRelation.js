import { SchemaDirectiveVisitor } from 'graphql-tools';

import { allQueryArgs, getRelationFieldName } from '../utils';

import { appendTransform, applyInputTransform } from '../inputTypes/utils';

import { FIND, FIND_IDS, FIND_ONE } from '../queryExecutor';

import InputTypes from '../inputTypes';
import TypeWrap from '../typeWrap';
import * as HANDLER from '../inputTypes/handlers';
import * as KIND from '../inputTypes/kinds';
import * as Transforms from '../inputTypes/transforms';

export const ExtRelationScheme = `directive @extRelation(field:String="_id", storeField:String=null, many:Boolean=false ) on FIELD_DEFINITION`;

export default queryExecutor =>
  class ExtRelationDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field, { objectType }) {
      const { _typeMap: SchemaTypes } = this.schema;
      const { field: relationField, storeField, many } = this.args;
      let fieldTypeWrap = new TypeWrap(field.type);

      this.mmObjectType = objectType;
      this.mmFieldTypeWrap = fieldTypeWrap;
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

    _onSchemaBuild = ({ field }) => {
      let fieldTypeWrap = new TypeWrap(field.type);

      //Collection name and interface modifier
      if (fieldTypeWrap.isInherited()) {
        let { mmDiscriminator } = fieldTypeWrap.realType();
        let { mmDiscriminatorField } = fieldTypeWrap.interfaceType();

        this.mmCollectionName = fieldTypeWrap.realType().mmCollectionName;
        this.mmInterfaceModifier = {
          [mmDiscriminatorField]: mmDiscriminator,
        };
      } else {
        this.mmInterfaceModifier = {};
        this.mmCollectionName = fieldTypeWrap.realType().mmCollectionName;
      }
    };

    _resolveSingle = field => async (parent, args, context, info) => {
      const { field: relationField } = this.args;
      let { mmStoreField: storeField, mmInterfaceModifier } = this;

      let value = parent[relationField];
      let selector = {
        [storeField]: value,
        ...mmInterfaceModifier,
      };

      return queryExecutor({
        type: FIND_ONE,
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
      if (Object.keys(mmInterfaceModifier)) {
        selector = {
          ...selector,
          [storeField]: value,
          ...mmInterfaceModifier,
        };
      } else if (fieldTypeWrap.realType().mmInherit) {
        selector = {
          ...selector,
        };
        let ids = value || [];
        return queryExecutor({
          type: FIND_IDS,
          collection: this.mmCollectionName,
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

      return queryExecutor({
        type: FIND,
        collection: this.mmCollectionName,
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
  };
