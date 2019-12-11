import { GraphQLInt, GraphQLList, GraphQLNonNull } from 'graphql';
import pluralize from 'pluralize';
import R from 'ramda';
import { AMReadOperation } from '../execution/operations/readOperation';
import { AMOrderByTypeFactory } from '../inputTypes/orderBy';
import { AMWhereTypeFactory } from '../inputTypes/where';
import { lowercaseFirstLetter } from '../tsutils';
import {
  AMField,
  AMModelType,
  IAMModelQueryFieldFactory,
} from '../definitions';
import { resolve } from '../resolve';

export const AMModelMultipleQueryFieldFactory: IAMModelQueryFieldFactory = {
  getFieldName(modelType: AMModelType): string {
    return R.pipe(pluralize, lowercaseFirstLetter)(modelType.name);
  },
  getField(modelType: AMModelType, schemaInfo) {
    return <AMField>{
      name: this.getFieldName(modelType),
      description: '',
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(modelType))),
      args: [
        {
          name: 'where',
          type: schemaInfo.resolveFactoryType(modelType, AMWhereTypeFactory),
        },
        {
          name: 'orderBy',
          type: schemaInfo.resolveFactoryType(modelType, AMOrderByTypeFactory),
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
        const operation = new AMReadOperation(transaction, {
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
