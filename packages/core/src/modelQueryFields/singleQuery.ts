import { GraphQLInt, GraphQLList, GraphQLNonNull } from 'graphql';
import pluralize from 'pluralize';
import R from 'ramda';
import { AMReadOperation } from '../execution/operations/readOperation';
import { AMOrderByTypeFactory } from '../inputTypes/orderBy';
import { AMWhereUniqueTypeFactory } from '../inputTypes/whereUnique';
import { lowercaseFirstLetter } from '../tsutils';
import {
  AMField,
  AMModelType,
  IAMModelQueryFieldFactory,
} from '../definitions';
import { resolve } from '../resolve';

export const AMModelSingleQueryFieldFactory: IAMModelQueryFieldFactory = {
  getFieldName(modelType: AMModelType): string {
    return lowercaseFirstLetter(modelType.name);
  },
  getField(modelType: AMModelType, resolveTypes) {
    return <AMField>{
      name: this.getFieldName(modelType),
      description: '',
      type: modelType,
      args: [
        {
          name: 'where',
          type: resolveTypes.resolveFactoryType(
            modelType,
            AMWhereUniqueTypeFactory
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
        stack.pop();
      },
      resolve: resolve,
    };
  },
};
