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
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { AMOperation } from '../execution/operation';

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
