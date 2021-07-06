import { AMVisitable } from '../../../definitions';
import { AMDataContext, AMObjectFieldContext } from '../../../execution';
import { toArray } from '../../../utils';

export const updateObjectFieldVisitorHandler = (
  fieldName: string,
  modifier: 'set' | 'pushEach'
): AMVisitable => {
  return {
    amEnter(node, transaction, stack) {
      const action = new AMObjectFieldContext(fieldName);
      stack.push(action);
    },
    amLeave(node, transaction, stack) {
      const operation = stack.lastOperation();
      const context = stack.pop() as AMObjectFieldContext;
      const path = stack.getFieldPath(operation);

      if (modifier === 'set') {
        const set = operation.data['$set'] || {};
        set[path] = context.value;
        operation.data.addValue('$set', set);
      } else if (modifier === 'pushEach') {
        const pushEach = operation.data['$push'] || {};
        pushEach[path] = { $each: toArray(context.value) };
        operation.data.addValue('$push', pushEach);
      }

      const lastInStack = stack.last();
      if (lastInStack instanceof AMDataContext) {
        lastInStack.addValue(fieldName, true);
      }
    },
  };
};
