import { GraphQLInt, GraphQLNonNull } from 'graphql';
import pluralize from 'pluralize';
import R from 'ramda';
import {
  AMField,
  AMMethodFieldFactory,
  AMModelType,
  GraphQLOperationType,
} from '../../definitions';
import { AMDeleteOperation } from '../../execution/operations/deleteOperation';
import { resolve } from '../../resolve';
import { attachDiscriminatorToOperationHandler } from './visitorHandlers/attachDiscriminatorToOperationHandler';

export class AMModelDeleteManyMutationFieldFactory extends AMMethodFieldFactory {
  getOperationType() {
    return GraphQLOperationType.Mutation;
  }
  getFieldName(modelType: AMModelType): string {
    return R.pipe(pluralize, R.concat('delete'))(modelType.name);
  }
  getField(modelType: AMModelType) {
    return {
      name: this.getFieldName(modelType),
      description: '',
      isDeprecated: false,
      type: new GraphQLNonNull(GraphQLInt),
      args: [
        {
          name: 'where',
          type: new GraphQLNonNull(
            this.configResolver.resolveInputType(modelType, this.links.where)
          ),
        },
      ],
      amEnter(node, transaction, stack) {
        const operation = new AMDeleteOperation(transaction, {
          many: true,
          collectionName: modelType.mmCollectionName,
        });
        stack.push(operation);
      },
      ...attachDiscriminatorToOperationHandler(modelType),
      resolve: resolve,
    } as AMField;
  }
}
