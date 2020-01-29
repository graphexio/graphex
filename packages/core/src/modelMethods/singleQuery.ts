import { isInterfaceType } from 'graphql';
import {
  AMField,
  AMModelType,
  GraphQLOperationType,
  IAMMethodFieldFactory,
} from '../definitions';
import { AMSelectorContext } from '../execution/contexts/selector';
import { AMReadOperation } from '../execution/operations/readOperation';
import { AMInterfaceWhereUniqueTypeFactory } from '../inputTypes/interfaceWhereUnique';
import { AMWhereUniqueTypeFactory } from '../inputTypes/whereUnique';
import { resolve } from '../resolve';
import { lowercaseFirstLetter } from '../utils';

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
            isInterfaceType(modelType)
              ? AMInterfaceWhereUniqueTypeFactory
              : AMWhereUniqueTypeFactory
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
