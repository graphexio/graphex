import TypeWrap from '@apollo-model/type-wrap';
import {
  GraphQLSchema,
  isInterfaceType,
  isObjectType,
  isOutputType,
} from 'graphql';
import { firstArg } from '../args/first';
import { skipArg } from '../args/skip';
import { AMConfigResolver } from '../config/resolver';
import { AMField, AMModelField, AMModelType } from '../definitions';
import { AMAggregateOperation } from '../execution/operations/aggregateOperation';
import { makeSchemaInfo } from '../schemaInfo';

export const relationDirective = (
  schema: GraphQLSchema,
  configResolver: AMConfigResolver
) => {
  const schemaInfo = makeSchemaInfo(schema);

  Object.values(schema.getTypeMap()).forEach(type => {
    if (isOutputType(type) && (isObjectType(type) || isInterfaceType(type))) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        if (field.relation) {
          const typeWrap = new TypeWrap(field.type);
          const realType = typeWrap.realType() as AMModelType;

          field.args = [
            {
              name: 'where',
              description: null,
              extensions: undefined,
              astNode: undefined,
              type: configResolver.resolveInputType(realType, 'where'),
              defaultValue: undefined,
            },
            ...(!realType.mmAbstract
              ? [
                  {
                    name: 'orderBy',
                    description: null,
                    extensions: undefined,
                    astNode: undefined,
                    type: configResolver.resolveInputType(realType, 'orderBy'),
                    defaultValue: undefined,
                  },
                ]
              : []),
            skipArg,
            firstArg,
          ];

          if (!realType.mmAbstract && typeWrap.isMany()) {
            type.getFields()[`${field.name}Connection`] = <AMField>{
              name: `${field.name}Connection`,
              isDeprecated: false,
              description: '',
              extensions: undefined,
              astNode: undefined,
              type: configResolver.resolveType(realType, 'connection'),
              args: [
                {
                  name: 'where',
                  type: configResolver.resolveInputType(realType, 'where'),
                },
                skipArg,
                firstArg,
              ],
              /* Type resolvers from above lines shouldn't use these new fields */
              mmFieldFactories: {
                AMCreateTypeFactory: [],
                AMUpdateTypeFactory: [],
                AMWhereTypeFactory: [],
                AMWhereUniqueTypeFactory: [],
                AMWhereCleanTypeFactory: [],
              },
              amEnter(node, transaction, stack) {
                const operation = new AMAggregateOperation(transaction, {
                  many: false,
                  collectionName: realType.mmCollectionName,
                });
                stack.push(operation);
              },
              amLeave(node, transaction, stack) {
                stack.pop();
              },
            };
          }
        }
      });
    }
  });
};
