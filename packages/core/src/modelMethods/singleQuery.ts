import { GraphQLInt, GraphQLList, GraphQLNonNull } from 'graphql';
import pluralize from 'pluralize';
import R from 'ramda';
import { AMReadOperation } from '../execution/operations/readOperation';
import { AMOrderByTypeFactory } from '../inputTypes/orderBy';
import { AMWhereUniqueTypeFactory } from '../inputTypes/whereUnique';
import { AMWhereACLTypeFactory } from '../inputTypes/whereACL';
import { lowercaseFirstLetter } from '../utils';
import {
  AMField,
  AMModelType,
  IAMFieldFactory,
  IAMMethodFieldFactory,
  GraphQLOperationType,
} from '../definitions';
import { resolve } from '../resolve';
import { AMSelectorContext } from '../execution/contexts/selector';
import { AMWhereTypeFactory } from '../inputTypes/where';

export const AMModelSingleQueryFieldFactory: IAMMethodFieldFactory = {
  getOperationType() {
    return GraphQLOperationType.Query;
  },
  getFieldName(modelType: AMModelType): string {
    return lowercaseFirstLetter(modelType.name);
  },
  getField(modelType: AMModelType, schemaInfo) {
    return <AMField>{
      name: this.getFieldName(modelType),
      description: '',
      isDeprecated: false,
      type: modelType,
      args: [
        {
          name: 'where',
          type: schemaInfo.resolveFactoryType(
            modelType,
            AMWhereUniqueTypeFactory
          ),
        },
        ...(schemaInfo.options.aclWhere
          ? [
              {
                name: 'aclWhere',
                type: schemaInfo.resolveFactoryType(
                  modelType,
                  AMWhereACLTypeFactory
                ),
              },
            ]
          : []),
      ],
      amEnter(node, transaction, stack) {
        const operation = new AMReadOperation(transaction, {
          many: false,
          collectionName: modelType.mmCollectionName,
        });
        stack.push(operation);
      },
      amLeave(node, transaction, stack) {
        const context = stack.pop() as AMReadOperation;
        if (modelType.mmDiscriminatorField && modelType.mmDiscriminator) {
          if (!context.selector) {
            context.setSelector(new AMSelectorContext());
          }

          context.selector.addValue(
            modelType.mmDiscriminatorField,
            modelType.mmDiscriminator
          );
        }
      },
      resolve: resolve,
    };
  },
};
