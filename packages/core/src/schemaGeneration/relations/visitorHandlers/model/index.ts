import { SelectorOperators } from '@graphex/abstract-datasource-adapter';
import { AMModelType, AMVisitable } from '../../../../definitions';
import { AMDataContext } from '../../../../execution/contexts/data';
import { AMListValueContext } from '../../../../execution/contexts/listValue';
import { AMObjectFieldContext } from '../../../../execution/contexts/objectField';
import { AMSelectorContext } from '../../../../execution/contexts/selector';
import { AMCreateOperation } from '../../../../execution/operations/createOperation';
import { AMReadOperation } from '../../../../execution/operations/readOperation';
import { ResultPromiseTransforms } from '../../../../execution/resultPromise';

export const modelReadManyHandlerFactory = (modelType: AMModelType) => (
  methodName: string
) => {
  return {
    amEnter(node, transaction, stack) {
      const opContext = new AMReadOperation(transaction, {
        many: true,
        collectionName: modelType.mmCollectionName,
      });
      stack.push(opContext);

      /* Next context will be List and it hasn't default 
          instructions how to pass value into operation */

      const selectorContext = new AMSelectorContext();
      stack.push(selectorContext);

      const orContext = new AMObjectFieldContext(SelectorOperators.OR);
      stack.push(orContext);
    },
    amLeave(node, transaction, stack) {
      const orContext = stack.pop() as AMObjectFieldContext;
      const selectorContext = stack.pop() as AMSelectorContext;
      const opContext = stack.pop() as AMReadOperation;

      selectorContext.addValue(orContext.fieldName, orContext.value);

      opContext.setSelector(selectorContext);

      const lastInStack = stack.last();
      if (lastInStack instanceof AMDataContext) {
        lastInStack.addValue(
          methodName,
          opContext
            .getOutput()
            .map(
              new ResultPromiseTransforms.Distinct(
                stack.lastPathNode(1).field.relation.relationField
              )
            )
        );
      }
    },
  } as AMVisitable;
};

export const modelCreateManyHandlerFactory = (modelType: AMModelType) => (
  methodName: string
) => {
  return {
    amEnter(node, transaction, stack) {
      const opContext = new AMCreateOperation(transaction, {
        many: true,
        collectionName: modelType.mmCollectionName,
      });
      stack.push(opContext);

      /* Next context will be List and it hasn't default 
      instructions how to pass value into operation */

      const listContext = new AMListValueContext();
      listContext.setProxy(true);
      stack.push(listContext);
    },
    amLeave(node, transaction, stack) {
      const listContext = stack.pop() as AMListValueContext;
      const opContext = stack.pop() as AMReadOperation;
      opContext.setDataList(listContext);

      const lastInStack = stack.last();
      if (lastInStack instanceof AMDataContext) {
        lastInStack.addValue(
          methodName,
          opContext
            .getOutput()
            .map(
              new ResultPromiseTransforms.Distinct(
                stack.lastPathNode(1).field.relation.relationField
              )
            )
        );
      }
    },
  };
};

export const modelReadOneHandlerFactory = (modelType: AMModelType) => (
  methodName: string
) => {
  return {
    amEnter(node, transaction, stack) {
      const opContext = new AMReadOperation(transaction, {
        many: false,
        collectionName: modelType.mmCollectionName,
      });
      stack.push(opContext);
    },
    amLeave(node, transaction, stack) {
      const opContext = stack.pop() as AMCreateOperation;

      const lastInStack = stack.last();
      if (lastInStack instanceof AMDataContext) {
        lastInStack.addValue(
          methodName,
          opContext
            .getOutput()
            .map(
              new ResultPromiseTransforms.Path(
                stack.lastPathNode(1).field.relation.relationField
              )
            )
        );
      }
    },
  } as AMVisitable;
};

export const modelCreateOneHandlerFactory = (modelType: AMModelType) => (
  methodName: string
) => {
  return {
    amEnter(node, transaction, stack) {
      const opContext = new AMCreateOperation(transaction, {
        many: false,
        collectionName: modelType.mmCollectionName,
      });
      stack.push(opContext);
    },
    amLeave(node, transaction, stack) {
      const opContext = stack.pop() as AMCreateOperation;

      const lastInStack = stack.last();
      if (lastInStack instanceof AMDataContext) {
        lastInStack.addValue(
          methodName,
          opContext
            .getOutput()
            .map(
              new ResultPromiseTransforms.Path(
                stack.lastPathNode(1).field.relation.relationField
              )
            )
        );
      }
    },
  } as AMVisitable;
};
