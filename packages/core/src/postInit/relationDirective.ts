import {
  GraphQLInt,
  GraphQLSchema,
  isInterfaceType,
  isObjectType,
  GraphQLInputField,
  GraphQLInputType,
  GraphQLNamedType,
  isOutputType,
} from 'graphql';
import {
  AMModelField,
  AMModelType,
  AMResolveFactoryType,
  IAMTypeFactory,
  AMField,
} from '../definitions';
import TypeWrap from '@apollo-model/type-wrap';
import { AMWhereTypeFactory } from '../inputTypes/where';
import { AMOrderByTypeFactory } from '../inputTypes/orderBy';
import { skipArg } from '../args/skip';
import { firstArg } from '../args/first';
import { AMAggregateOperation } from '../execution/operations/aggregateOperation';
import { makeSchemaInfo } from '../schemaInfo';
import { AMConnectionTypeFactory } from '../types/connection';

export const relationDirective = (schema: GraphQLSchema) => {
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
              type: schemaInfo.resolveFactoryType(realType, AMWhereTypeFactory),
              defaultValue: undefined,
            },
            ...(!realType.mmAbstract
              ? [
                  {
                    name: 'orderBy',
                    description: null,
                    type: schemaInfo.resolveFactoryType(
                      realType,
                      AMOrderByTypeFactory
                    ),
                    defaultValue: undefined,
                  },
                ]
              : []),
            skipArg,
            firstArg,
          ];

          if (!realType.mmAbstract) {
            type.getFields()[`${field.name}Connection`] = <AMField>{
              name: `${field.name}Connection`,
              isDeprecated: false,
              description: '',
              type: schemaInfo.resolveFactoryType(
                realType,
                AMConnectionTypeFactory
              ),
              args: [
                {
                  name: 'where',
                  type: schemaInfo.resolveFactoryType(
                    realType,
                    AMWhereTypeFactory
                  ),
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
