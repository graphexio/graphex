import { defaultFieldResolver } from 'graphql';
import { SchemaDirectiveVisitor } from 'graphql-tools';

import _ from 'lodash';

import { GraphQLID, GraphQLList } from 'graphql';

import {
  FIND,
  FIND_ONE,
  DISTINCT,
  COUNT,
  getInputType,
  getLastType,
  hasQLListType,
  mapFiltersToSelector,
  getRelationFieldName,
  allQueryArgs,
  GraphQLTypeFromString,
  combineResolvers,
  getInputTypeName,
  applyInputTransform,
} from '../utils';

import InputTypes from '../inputTypes';

export const ExtRelationScheme = `directive @extRelation(field:String="_id", fieldType:String="ObjectID" ) on FIELD_DEFINITION`;

export default queryExecutor =>
  class ExtRelationDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field, { objectType }) {
      const { _typeMap: SchemaTypes } = this.schema;
      const { field: relationField } = this.args;

      this.mmObjectType = objectType;
      this.mmInputTypes = new InputTypes({ SchemaTypes });
      this.mmLastType = getLastType(field.type);
      this.mmIsMany = hasQLListType(field.type);
      this.mmStoreField = getRelationFieldName(
        this.mmObjectType.name,
        relationField,
        false
      );

      if (!field.mmTransformToInput) field.mmTransformToInput = {};
      field.mmTransformToInput.orderBy = field => [];
      field.mmTransformToInput.create = field => {};
      field.mmTransformToInput.where = field => {};
      field.mmOnSchemaInit = this._onSchemaInit;

      field.resolve = this.mmIsMany
        ? this._resolveMany(field)
        : this._resolveSingle(field);
    }

    _onSchemaInit = field => {
      let { mmLastType: lastType, mmIsMany: isMany } = this;

      if (isMany) {
        let whereType = this.mmInputTypes.get(lastType, 'where');
        let orderByType = this.mmInputTypes.get(lastType, 'orderBy');

        field.args = allQueryArgs({
          filterType: whereType,
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

      let value = parent[relationField];
      if (_.isArray(value)) {
        value = { $in: value };
      }
      let selector = {
        ...(await applyInputTransform(args.where, whereType)),
        [storeField]: value,
      };
      console.log({
        selector,
        args: args.where,
        whereType,
        transform: await applyInputTransform(args.where, whereType),
      });
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
          filterType: whereType,
          orderByType,
        }),
        type: SchemaTypes._QueryMeta,
        resolve: async (parent, args, context, info) => {
          let value = parent[relationField];
          if (_.isArray(value)) {
            value = { $in: value };
          }
          let selector = {
            ...(await applyInputTransform(args.where, whereType)),
            [storeField]: value,
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
      };
    };
  };
