import { UserInputError } from 'apollo-server';
import R from 'ramda';
import { AMModelField, AMVisitable } from '../definitions';
import { AMDataContext } from '../execution/contexts/data';
import { AMListValueContext } from '../execution/contexts/listValue';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { AMSelectorContext } from '../execution/contexts/selector';
import { AMOperation } from '../execution/operation';

export function defaultObjectFieldVisitorHandler(
  fieldName: string,
  field?: AMModelField
): AMVisitable {
  return {
    amEnter(node, transaction, stack) {
      const action = new AMObjectFieldContext(fieldName, field);
      stack.push(action);
    },
    amLeave(node, transaction, stack) {
      const context = stack.pop() as AMObjectFieldContext;

      const lastInStack = stack.last();
      if (
        lastInStack instanceof AMDataContext ||
        lastInStack instanceof AMObjectFieldContext ||
        lastInStack instanceof AMSelectorContext
      ) {
        lastInStack.addValue(context.fieldName, context.value);
      }
    },
  };
}

export function updateObjectFieldVisitorHandler(
  fieldName: string
): AMVisitable {
  return {
    amEnter(node, transaction, stack) {
      const action = new AMObjectFieldContext(fieldName);
      stack.push(action);
    },
    amLeave(node, transaction, stack) {
      const operation = stack.lastOperation();
      const path = stack.getFieldPath(operation);

      const context = stack.pop() as AMObjectFieldContext;
      const set = operation.data['$set'] || {};
      set[path] = context.value;
      operation.data['$set'] = set;
    },
  };
}

export function whereTypeVisitorHandler(
  options = { emptyAllowed: true }
): AMVisitable {
  return {
    amEnter(node, transaction, stack) {
      const context = new AMSelectorContext();
      stack.push(context);
    },
    amLeave(node, transaction, stack) {
      const context = stack.pop() as AMSelectorContext;
      const lastInStack = stack.last();

      if (
        !options.emptyAllowed &&
        Object.values(R.omit(['aclWhere'], context.selector)).length === 0
      ) {
        throw new UserInputError(
          `WhereUniqueType cannot be empty. Provided value is ${JSON.stringify(
            context.selector,
            null,
            2
          )}`
        );
      }

      if (context.selector.aclWhere) {
        context.selector = {
          $and: [
            R.omit(['aclWhere'], context.selector),
            context.selector.aclWhere,
          ],
        };
      }

      if (lastInStack instanceof AMOperation) {
        lastInStack.setSelector(context);
      } else if (lastInStack instanceof AMListValueContext) {
        lastInStack.addValue(context.selector);
      } else if (lastInStack instanceof AMObjectFieldContext) {
        lastInStack.setValue(context.selector);
      }
    },
  };
}
