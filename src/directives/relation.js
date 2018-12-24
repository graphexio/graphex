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
} from './utils';

export const RelationScheme = `directive @relation(field:String="_id", externalField:String, fieldType:String="ObjectID" ) on FIELD_DEFINITION`;

export default queryExecutor =>
  class RelationDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field, { objectType }) {
      // console.log(field.name, objectType);
      const { field: relationField, externalField, fieldType } = this.args;
      const { _typeMap: SchemaTypes } = this.schema;

      if (externalField) {
        field.skipFilter = true;
      }

      let lastType = getLastType(field.type);
      let isMany = hasQLListType(field.type);
      let collection = lastType.name;

      ///////map filter to selector
      const { resolveMapFilterToSelector } = field;
      let filterType = getInputType(`${lastType}Filter`, SchemaTypes);
      field.resolveMapFilterToSelector = async params => {
        if (resolveMapFilterToSelector) {
          params = await resolveMapFilterToSelector.apply(this, params);
        }

        let res = params.map(async ({ fieldName, value }) => {
          value = await queryExecutor({
            type: DISTINCT,
            collection,
            selector: await mapFiltersToSelector(value, filterType._fields),
            options: {
              key: relationField,
            },
          });

          fieldName = getRelationFieldName(collection, relationField, isMany);
          if (!isMany) {
            value = { $in: value };
          }
          return { fieldName, value };
        });
        return Promise.all(res);
      };

      ////////////////////

      let valueField = getRelationFieldName(collection, relationField, isMany);
      ////add id field
      if (!externalField) {
        objectType._fields[valueField] = {
          ...field,
          name: valueField,
          isDeprecated: false,
          args: [],
          type: isMany
            ? new GraphQLList(GraphQLTypeFromString(fieldType))
            : GraphQLTypeFromString(fieldType),
          resolve: field.resolve ? field.resolve : defaultFieldResolver,
          skipCreate: field.skipCreate,
        };
      }

      /////resolve

      let relField = relationField;
      if (externalField) {
        valueField = relationField;
        relField = externalField;
      }

      if (isMany) {
        let filterType = getInputType(`${collection}Filter`, SchemaTypes);
        let orderByType = getInputType(`${collection}OrderBy`, SchemaTypes);
        field.args = allQueryArgs({
          filterType,
          orderByType,
        });
        field.resolve = combineResolvers(
          field.resolve,
          (parent, args, context, info) => {
            let value = parent[valueField];
            if (_.isArray(value)) {
              value = { $in: value };
            }
            let selector = {
              ...mapFiltersToSelector(args.filter, filterType._fields),
              [relField]: value,
            };
            return queryExecutor({
              type: FIND,
              collection,
              selector,
              options: { skip: args.skip, limit: args.first },
              context,
            });
          }
        );

        ///////////Meta field
        let metaName = `_${field.name}Meta`;
        objectType._fields[metaName] = {
          name: metaName,
          skipFilter: true,
          skipCreate: true,
          isDeprecated: false,
          args: allQueryArgs({
            filterType,
            orderByType,
          }),
          type: SchemaTypes._QueryMeta,
          resolve: (parent, args, context, info) => {
            let value = parent[valueField];
            if (_.isArray(value)) {
              value = { $in: value };
            }
            let selector = {
              ...mapFiltersToSelector(args.filter, filterType._fields),
              [relField]: value,
            };
            return {
              count: queryExecutor({
                type: COUNT,
                collection,
                selector,
                options: { skip: args.skip, limit: args.first },
                context,
              }),
            };
          },
        };
        // console.log(objectType._fields);
        ////
      } else {
        field.resolve = combineResolvers(
          field.resolve,
          (parent, args, context, info) => {
            let value = parent[valueField];
            let selector = {
              [relationField]: value,
            };

            return queryExecutor({
              type: FIND_ONE,
              collection,
              selector: { [relationField]: value },
              options: { skip: args.skip, limit: args.first },
              context,
            });
          }
        );
      }

      field.skipCreate = true;
    }

    // const { resolveMapFilterToSelector } = field;
    // field.resolveMapFilterToSelector = function(params) {
    //   console.log(params);
    //   if (resolveMapFilterToSelector) {
    //     params = resolveMapFilterToSelector.apply(this, params);
    //   }
    //   // console.log({ fieldName, value });
    //   return params.map(({ fieldName, value }) => ({ fieldName: name, value }));
    // };

    // const { resolve = defaultFieldResolver } = field;
    // field.resolve = async function(parent, args, context, info) {
    //   return parent[name];
    // };
  };
