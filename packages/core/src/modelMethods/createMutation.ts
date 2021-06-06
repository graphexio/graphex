import { GraphQLNonNull } from 'graphql';
import R from 'ramda';
import {
  AMField,
  AMMethodFieldFactory,
  AMModelType,
  GraphQLOperationType,
} from '../definitions';
import { AMCreateOperation } from '../execution/operations/createOperation';
import { resolve } from '../resolve';

export class AMModelCreateMutationFieldFactory extends AMMethodFieldFactory {
  getOperationType() {
    return GraphQLOperationType.Mutation;
  }
  getFieldName(modelType: AMModelType): string {
    return R.concat('create')(modelType.name);
  }
  getField(modelType: AMModelType) {
    return {
      name: this.getFieldName(modelType),
      description: '',
      isDeprecated: false,
      type: modelType,
      args: [
        {
          name: 'data',
          type: new GraphQLNonNull(
            this.configResolver.resolveInputType(modelType, this.links.data)
          ),
        },
      ],
      amEnter(node, transaction, stack) {
        const operation = new AMCreateOperation(transaction, {
          many: false,
          collectionName: modelType.mmCollectionName,
        });
        stack.push(operation);
      },
      amLeave(node, transaction, stack) {
        stack.pop();
      },
      resolve: resolve,
    } as AMField;
  }
}
