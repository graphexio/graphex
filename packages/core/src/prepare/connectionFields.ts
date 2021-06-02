import TypeWrap from '@graphex/type-wrap';
import {
  GraphQLSchema,
  isInterfaceType,
  isObjectType,
  isOutputType,
} from 'graphql';
import { firstArg } from '../args/first';
import { offsetArg } from '../args/offset';
import { AMConfigResolver } from '../config/resolver';
import { AMField, AMModelField, AMModelType } from '../definitions';
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
                offsetArg,
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
              resolve: parent => parent,
            } as AMField;
          }
        }
      });
    }
  });
};
