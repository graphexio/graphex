import R from 'ramda';
import { AMArgumet } from '../definitions';
import { GraphQLInt } from 'graphql';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { AMOperation } from '../execution/operation';

export const skipArg: AMArgumet = {
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
};
