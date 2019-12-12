import { GraphQLNonNull } from 'graphql';
import R from 'ramda';
import { AMUpdateOperation } from '../execution/operations/updateOperation';
import { AMUpdateTypeFactory } from '../inputTypes/update';
import { AMWhereUniqueTypeFactory } from '../inputTypes/whereUnique';
import { resolve } from '../resolve';
import { AMField, AMModelType, IAMFieldFactory } from '../definitions';

export const AMModelUpdateMutationFieldFactory: IAMFieldFactory = {
  getFieldName(modelType: AMModelType): string {
    return R.concat('update')(modelType.name);
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
            schemaInfo.resolveFactoryType(modelType, AMUpdateTypeFactory)
          ),
        },
        {
          name: 'where',
          type: new GraphQLNonNull(
            schemaInfo.resolveFactoryType(modelType, AMWhereUniqueTypeFactory)
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
        stack.pop();
      },
      resolve: resolve,
    };
  },
};
