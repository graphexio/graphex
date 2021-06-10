import { AMModelType } from '../../../definitions';
import { AMDataContext } from '../../../execution/contexts/data';
import { AMListValueContext } from '../../../execution/contexts/listValue';

export const abstractReadHandlerFactory = (modelType: AMModelType) => (
  methodName: string
) => {
  return {
    amEnter(node, transaction, stack) {
      const listContext = new AMListValueContext();
      stack.push(listContext);
    },
    amLeave(node, transaction, stack) {
      const listContext = stack.pop() as AMListValueContext;
      const lastInStack = stack.last();
      if (lastInStack instanceof AMDataContext) {
        lastInStack.addValue(methodName, listContext.values);
      }
    },
  };
};

export const abstractCreateHandlerFactory = (modelType: AMModelType) => (
  methodName: string
) => {
  return {
    amEnter(node, transaction, stack) {
      const listContext = new AMListValueContext();
      listContext.setProxy(true);
      stack.push(listContext);
    },
    amLeave(node, transaction, stack) {
      const listContext = stack.pop() as AMListValueContext;
      const lastInStack = stack.last();
      if (lastInStack instanceof AMDataContext) {
        lastInStack.addValue(methodName, listContext.values);
      }
    },
  };
};
