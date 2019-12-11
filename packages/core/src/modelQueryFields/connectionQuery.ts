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
import { AMConnectionTypeFactory } from '../types/connection';
import { AMWhereTypeFactory } from '../inputTypes/where';

export const AMModelConnectionQueryFieldFactory: IAMModelQueryFieldFactory = {
  getFieldName(modelType: AMModelType): string {
    return R.pipe(pluralize, lowercaseFirstLetter, R.concat)(modelType.name)(
      'Connection'
    );
  },
  getField(modelType: AMModelType, schemaInfo) {
    return <AMField>{
      name: this.getFieldName(modelType),
      description: '',
      type: schemaInfo.resolveFactoryType(modelType, AMConnectionTypeFactory),
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
