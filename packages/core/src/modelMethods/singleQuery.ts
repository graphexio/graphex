import {
  AMMethodFieldFactory,
  AMModelType,
  GraphQLOperationType,
} from '../definitions';
import { AMReadOperation } from '../execution/operations/readOperation';
import { resolve } from '../resolve';
import { lowercaseFirstLetter } from '../utils';
import { attachDiscriminatorToOperationHandler } from '../visitorHandlers/attachDiscriminatorToOperationHandler';

export class AMModelSingleQueryFieldFactory extends AMMethodFieldFactory {
  getOperationType() {
    return GraphQLOperationType.Query;
  }
  getFieldName(modelType: AMModelType): string {
    return lowercaseFirstLetter(modelType.name);
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
          name: 'where',
          description: undefined,
          defaultValue: undefined,
          extensions: undefined,
          astNode: undefined,
          type: this.configResolver.resolveInputType(
            modelType,
            this.links.whereUnique
          ),
        },
      ],
      amEnter(node, transaction, stack) {
        const operation = new AMReadOperation(transaction, {
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
