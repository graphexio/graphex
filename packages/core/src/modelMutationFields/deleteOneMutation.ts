import { GraphQLNonNull } from 'graphql';
import R from 'ramda';
import { AMDeleteOperation } from '../execution/operations/deleteOperation';
import { AMWhereUniqueTypeFactory } from '../inputTypes/whereUnique';
import { resolve } from '../resolve';
import { AMField, AMModelType, IAMFieldFactory } from '../definitions';

export const AMModelDeleteOneMutationFieldFactory: IAMFieldFactory = {
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
      ],
      amEnter(node, transaction, stack) {
        const operation = new AMDeleteOperation(transaction, {
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
