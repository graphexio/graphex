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
import { AMConnectionOperation } from '../execution/operations/connectionOperation';

export const connectionFields = (
  schema: GraphQLSchema,
  configResolver: AMConfigResolver
) => {
  Object.values(schema.getTypeMap()).forEach(type => {
    if (isOutputType(type) && (isObjectType(type) || isInterfaceType(type))) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        if (field.relation) {
          const typeWrap = new TypeWrap(field.type);
          const realType = typeWrap.realType() as AMModelType;

          if (!realType.mmAbstract && typeWrap.isMany()) {
            type.getFields()[`${field.name}Connection`] = {
              name: `${field.name}Connection`,
              isDeprecated: false,
              description: '',
              extensions: undefined,
              astNode: undefined,
              isConnection: true,
              type: configResolver.resolveType(realType, 'connection'),
              args: [
                {
                  name: 'where',
                  type: configResolver.resolveInputType(realType, 'where'),
                },
                skipArg,
                firstArg,
              ],
              amEnter(node, transaction, stack) {
                const operation = new AMConnectionOperation(transaction, {});
                operation.relationInfo = field.relation;
                stack.push(operation);
              },
              amLeave(node, transaction, stack) {
                stack.pop();
              },
            } as AMField;
          }
        }
      });
    }
  });
};
