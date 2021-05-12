import pluralize from 'pluralize';
import R from 'ramda';
import { firstArg } from '../args/first';
import { skipArg } from '../args/skip';
import {
  AMField,
  AMMethodFieldFactory,
  AMModelType,
  GraphQLOperationType,
} from '../definitions';
import { AMSelectorContext } from '../execution/contexts/selector';
import { AMAggregateOperation } from '../execution/operations/aggregateOperation';
import { resolve } from '../resolve';
import { lowercaseFirstLetter } from '../utils';

export class AMModelConnectionQueryFieldFactory extends AMMethodFieldFactory {
  getOperationType() {
    return GraphQLOperationType.Query;
  }
  getFieldName(modelType: AMModelType): string {
    return R.pipe(pluralize, lowercaseFirstLetter, R.concat)(modelType.name)(
      'Connection'
    );
  }
  getField(modelType: AMModelType) {
    return {
      name: this.getFieldName(modelType),
      description: '',
      isDeprecated: false,
      type: this.configResolver.resolveType(modelType, 'connection'),
      args: [
        {
          name: 'where',
          type: this.configResolver.resolveInputType(
            modelType,
            this.links.where
          ),
        },
        {
          name: 'orderBy',
          type: this.configResolver.resolveInputType(
            modelType,
            this.links.orderBy
          ),
        },
        skipArg,
        firstArg,
      ],
      amEnter(node, transaction, stack) {
        const operation = new AMAggregateOperation(transaction, {
          many: false,
          collectionName: modelType.mmCollectionName,
        });
        stack.push(operation);
      },
      amLeave(node, transaction, stack) {
        const context = stack.pop() as AMAggregateOperation;
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
    } as AMField;
  }
}
