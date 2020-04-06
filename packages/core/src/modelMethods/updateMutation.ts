import { GraphQLNonNull, isInterfaceType } from 'graphql';
import R from 'ramda';
import {
  AMField,
  AMMethodFieldFactory,
  AMModelType,
  GraphQLOperationType,
} from '../definitions';
import { AMSelectorContext } from '../execution/contexts/selector';
import { AMUpdateOperation } from '../execution/operations/updateOperation';
import { resolve } from '../resolve';

export class AMModelUpdateMutationFieldFactory extends AMMethodFieldFactory {
  getOperationType() {
    return GraphQLOperationType.Mutation;
  }
  getFieldName(modelType: AMModelType): string {
    return R.concat('update')(modelType.name);
  }
  getField(modelType: AMModelType) {
    return <AMField>{
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
        {
          name: 'where',
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
      amLeave(node, transaction, stack) {
        const context = stack.pop() as AMUpdateOperation;
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
  }
}
