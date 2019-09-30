import { GraphQLInt, GraphQLList, GraphQLNonNull } from 'graphql';
import pluralize from 'pluralize';
import R from 'ramda';
import { AMOrderByTypeFactory } from '../inputTypes/orderBy';
import { AMWhereTypeFactory } from '../inputTypes/where';
import { lowercaseFirstLetter } from '../tsutils';
import { AMModelType, IAMModelQueryFieldFactory, AMField } from '../types';
import { AMOperation } from '../execution/operations/operation';
import { AMReadOperation } from '../execution/operations/readOperation';

export const AMModelMultipleQieryFieldFactory: IAMModelQueryFieldFactory = {
  getFieldName(modelType: AMModelType): string {
    return R.pipe(
      pluralize,
      lowercaseFirstLetter
    )(modelType.name);
  },
  getField(modelType: AMModelType, resolveTypes) {
    return <AMField>{
      name: this.getFieldName(modelType),
      description: '',
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(modelType))),
      args: [
        {
          name: 'where',
          type: resolveTypes.resolveFactoryType(modelType, AMWhereTypeFactory),
        },
        {
          name: 'orderBy',
          type: resolveTypes.resolveFactoryType(
            modelType,
            AMOrderByTypeFactory
          ),
        },
        {
          name: 'skip',
          type: GraphQLInt,
        },
        {
          name: 'first',
          type: GraphQLInt,
        },
      ],
      amEnter(node, transaction, stack) {
        console.log('entered');
        const operation = new AMReadOperation(modelType.mmCollectionName);
        transaction.addOperation(operation);
        stack.push(operation);
      },
      amLeave(node, transaction, stack) {
        console.log('leaved');
        stack.pop();
      },
    };
  },
};
