import { GraphQLInt, GraphQLList, GraphQLNonNull } from 'graphql';
import pluralize from 'pluralize';
import R from 'ramda';
import { AMReadOperation } from '../execution/operations/readOperation';
import { AMOrderByTypeFactory } from '../inputTypes/orderBy';
import { AMWhereTypeFactory } from '../inputTypes/where';
import { lowercaseFirstLetter } from '../tsutils';
import { AMField, AMModelType, IAMModelQueryFieldFactory } from '../types';
import { resolve } from '../resolve';
import { AMCreateTypeFactory } from '../inputTypes/create';
import { AMCreateOperation } from '../execution/operations/createOperation';

export const AMModelCreateMutationFieldFactory: IAMModelQueryFieldFactory = {
  getFieldName(modelType: AMModelType): string {
    return R.concat('create')(modelType.name);
  },
  getField(modelType: AMModelType, resolveTypes) {
    return <AMField>{
      name: this.getFieldName(modelType),
      description: '',
      type: modelType,
      args: [
        {
          name: 'data',
          type: new GraphQLNonNull(
            resolveTypes.resolveFactoryType(modelType, AMCreateTypeFactory)
          ),
        },
      ],
      amEnter(node, transaction, stack) {
        const operation = new AMCreateOperation(transaction, {
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
