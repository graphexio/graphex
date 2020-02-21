import { GraphQLNonNull, isInterfaceType } from 'graphql';
import R from 'ramda';
import {
  AMField,
  AMModelType,
  GraphQLOperationType,
  IAMMethodFieldFactory,
} from '../definitions';
import { AMCreateOperation } from '../execution/operations/createOperation';
import { AMCreateTypeFactory } from '../inputTypes/create';
import { resolve } from '../resolve';
import { AMInterfaceCreateTypeFactory } from '../inputTypes/interfaceCreate';

export const AMModelCreateMutationFieldFactory: IAMMethodFieldFactory = {
  getOperationType() {
    return GraphQLOperationType.Mutation;
  },
  getFieldName(modelType: AMModelType): string {
    return R.concat('create')(modelType.name);
  },
  getField(modelType: AMModelType, schemaInfo) {
    return <AMField>{
      name: this.getFieldName(modelType),
      description: '',
      isDeprecated: false,
      type: modelType,
      args: [
        {
          name: 'data',
          type: new GraphQLNonNull(
            schemaInfo.resolveFactoryType(
              modelType,
              isInterfaceType(modelType)
                ? AMInterfaceCreateTypeFactory
                : AMCreateTypeFactory
            )
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
    };
  },
};
