import { GraphQLNonNull, GraphQLInt } from 'graphql';
import pluralize from 'pluralize';
import R from 'ramda';
import { AMDeleteOperation } from '../execution/operations/deleteOperation';
import { AMWhereUniqueTypeFactory } from '../inputTypes/whereUnique';
import { resolve } from '../resolve';
import { AMField, AMModelType, IAMModelQueryFieldFactory } from '../types';
import { AMWhereTypeFactory } from '../inputTypes/where';

export const AMModelDeleteManyMutationFieldFactory: IAMModelQueryFieldFactory = {
  getFieldName(modelType: AMModelType): string {
    return R.pipe(
      pluralize,
      R.concat('delete')
    )(modelType.name);
  },
  getField(modelType: AMModelType, resolveTypes) {
    return <AMField>{
      name: this.getFieldName(modelType),
      description: '',
      type: new GraphQLNonNull(GraphQLInt),
      args: [
        {
          name: 'where',
          type: new GraphQLNonNull(
            resolveTypes.resolveFactoryType(modelType, AMWhereTypeFactory)
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
      amLeave(node, transaction, stack) {
        stack.pop();
      },
      resolve: resolve,
    };
  },
};
