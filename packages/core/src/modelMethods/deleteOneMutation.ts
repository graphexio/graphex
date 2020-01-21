import { GraphQLNonNull } from 'graphql';
import R from 'ramda';
import { AMDeleteOperation } from '../execution/operations/deleteOperation';
import { AMWhereUniqueTypeFactory } from '../inputTypes/whereUnique';
import { resolve } from '../resolve';
import {
  AMField,
  AMModelType,
  IAMFieldFactory,
  IAMMethodFieldFactory,
  GraphQLOperationType,
} from '../definitions';
import { AMSelectorContext } from '../execution/contexts/selector';
import { AMWhereTypeFactory } from '../inputTypes/where';
import { AMWhereACLTypeFactory } from '../inputTypes/whereACL';

export const AMModelDeleteOneMutationFieldFactory: IAMMethodFieldFactory = {
  getOperationType() {
    return GraphQLOperationType.Mutation;
  },
  getFieldName(modelType: AMModelType): string {
    return R.concat('delete')(modelType.name);
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
          type: new GraphQLNonNull(
            schemaInfo.resolveFactoryType(modelType, AMWhereUniqueTypeFactory)
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
        const operation = new AMDeleteOperation(transaction, {
          many: false,
          collectionName: modelType.mmCollectionName,
        });
        stack.push(operation);
      },
      amLeave(node, transaction, stack) {
        const context = stack.pop() as AMDeleteOperation;
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
