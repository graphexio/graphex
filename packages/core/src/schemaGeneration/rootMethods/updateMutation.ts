import { GraphQLNonNull, isInterfaceType } from 'graphql';
import R from 'ramda';
import {
  AMMethodFieldFactory,
  AMModelType,
  GraphQLOperationType,
} from '../../definitions';
import { AMUpdateOperation } from '../../execution/operations/updateOperation';
import { resolve } from '../../resolve';
import { attachDiscriminatorToOperationHandler } from './visitorHandlers/attachDiscriminatorToOperationHandler';

export class AMModelUpdateMutationFieldFactory extends AMMethodFieldFactory {
  getOperationType() {
    return GraphQLOperationType.Mutation;
  }
  getFieldName(modelType: AMModelType): string {
    return R.concat('update')(modelType.name);
  }
  getField(modelType: AMModelType) {
    return {
      name: this.getFieldName(modelType),
      description: '',
      extensions: undefined,
      isDeprecated: false,
      type: modelType,
      args: [
        {
          name: 'data',
          description: undefined,
          defaultValue: undefined,
          extensions: undefined,
          astNode: undefined,
          type: new GraphQLNonNull(
            this.configResolver.resolveInputType(modelType, this.links.data)
          ),
        },
        {
          name: 'where',
          description: undefined,
          defaultValue: undefined,
          extensions: undefined,
          astNode: undefined,
          type: new GraphQLNonNull(
            this.configResolver.resolveInputType(
              modelType,
              isInterfaceType(modelType)
                ? this.links.whereInterface
                : this.links.where
            )
          ),
        },
      ],
      amEnter(node, transaction, stack) {
        const operation = new AMUpdateOperation(transaction, {
          many: false,
          collectionName: modelType.mmCollectionName,
        });
        stack.push(operation);
      },
      ...attachDiscriminatorToOperationHandler(modelType),
      resolve: resolve,
    };
  }
}
