import { GraphQLInt } from 'graphql';
import pluralize from 'pluralize';
import R from 'ramda';
import {
  AMField,
  AMModelType,
  IAMModelQueryFieldFactory,
} from '../definitions';
import { AMAggregateOperation } from '../execution/operations/aggregateOperation';
import { AMOrderByTypeFactory } from '../inputTypes/orderBy';
import { AMWhereTypeFactory } from '../inputTypes/where';
import { resolve } from '../resolve';
import { lowercaseFirstLetter } from '../tsutils';
import { AMConnectionTypeFactory } from '../types/connection';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { AMOperation } from '../execution/operation';

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
          amEnter(node, transaction, stack) {
            const context = new AMObjectFieldContext('arg');
            stack.push(context);
          },
          amLeave(node, transaction, stack) {
            const context = stack.pop() as AMObjectFieldContext;
            const lastInStack = R.last(stack);

            if (lastInStack instanceof AMOperation) {
              lastInStack.setSkip(context.value as number);
            }
          },
        },
        {
          name: 'first',
          type: GraphQLInt,
          amEnter(node, transaction, stack) {
            const context = new AMObjectFieldContext('arg');
            stack.push(context);
          },
          amLeave(node, transaction, stack) {
            const context = stack.pop() as AMObjectFieldContext;
            const lastInStack = R.last(stack);

            if (lastInStack instanceof AMOperation) {
              lastInStack.setFirst(context.value as number);
            }
          },
        },
      ],
      amEnter(node, transaction, stack) {
        const operation = new AMAggregateOperation(transaction, {
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
