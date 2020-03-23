import R from 'ramda';
import { AMArgumet } from '../definitions';
import { GraphQLInt } from 'graphql';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { AMOperation } from '../execution/operation';

export const firstArg: AMArgumet = {
  name: 'first',
  type: GraphQLInt,
  description: undefined,
  defaultValue: undefined,
  astNode: undefined,
  extensions: undefined,
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
};
