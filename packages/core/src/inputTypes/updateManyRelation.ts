import { GraphQLList } from 'graphql';
import { DBRef } from 'mongodb';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
  AMVisitable,
} from '../definitions';
import { AMDataContext } from '../execution/contexts/data';
import { AMListValueContext } from '../execution/contexts/listValue';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { AMSelectorContext } from '../execution/contexts/selector';
import { AMCreateOperation } from '../execution/operations/createOperation';
import { AMDeleteDBRefOperation } from '../execution/operations/deleteDbRefOperation';
import { AMReadOperation } from '../execution/operations/readOperation';
import {
  AMResultPromise,
  ResultPromiseTransforms,
} from '../execution/resultPromise';

const abstractConnectHandlerFactory = (modelType: AMModelType) => (
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

const modelConnectHandlerFactory = (modelType: AMModelType) => (
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

      const orContext = new AMObjectFieldContext('$or');
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

const connectHandlerFactory = (modelType: AMModelType) => {
  return modelType.mmAbstract
    ? abstractConnectHandlerFactory(modelType)
    : modelConnectHandlerFactory(modelType);
};

const modelCreateHandlerFactory = (modelType: AMModelType) => (
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

const abstractCreateHandlerFactory = (modelType: AMModelType) => (
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

const createHandlerFactory = (modelType: AMModelType) => {
  return modelType.mmAbstract
    ? abstractCreateHandlerFactory(modelType)
    : modelCreateHandlerFactory(modelType);
};

export class AMUpdateManyRelationTypeFactory extends AMTypeFactory<AMInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}UpdateManyRelationInput`;
  }

  // TODO: Refactor mmEnter, mmLeave

  getType(modelType: AMModelType) {
    const typeName = this.getTypeName(modelType);

    const connectHandler = connectHandlerFactory(modelType);
    const createHandler = createHandlerFactory(modelType);

    return new AMInputObjectType({
      name: typeName,
      fields: () => {
        const fields = {
          create: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, [
                'create',
                'interfaceCreate',
              ])
            ),
            ...createHandler('create'),
          },
          recreate: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, [
                'create',
                'interfaceCreate',
              ])
            ),
            ...createHandler('recreate'),
          },
          connect: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, [
                'whereUnique',
                'interfaceWhereUnique',
              ])
            ),
            ...connectHandler('connect'),
          },
          connectOnce: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, [
                'whereUnique',
                'interfaceWhereUnique',
              ])
            ),
            ...connectHandler('connectOnce'),
          },
          reconnect: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, [
                'whereUnique',
                'interfaceWhereUnique',
              ])
            ),
            ...connectHandler('reconnect'),
          },
          disconnect: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, [
                'whereUnique',
                'interfaceWhereUnique',
              ])
            ),
            ...connectHandler('disconnect'),
          },
          delete: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, [
                'whereUnique',
                'interfaceWhereUnique',
              ])
            ),
            ...connectHandler('delete'),
            ...(!modelType.mmAbstract
              ? {
                  //TODO: !!!!!!
                }
              : {
                  amEnter(node, transaction, stack) {
                    const listContext = new AMListValueContext();
                    stack.push(listContext);
                  },
                  amLeave(node, transaction, stack) {
                    const listContext = stack.pop() as AMListValueContext;
                    new AMDeleteDBRefOperation(transaction, {
                      many: true,
                      dbRefList: listContext.values as AMResultPromise<DBRef>[],
                    });

                    const lastInStack = stack.last();
                    if (lastInStack instanceof AMDataContext) {
                      lastInStack.addValue('delete', listContext.values);
                    }
                  },
                }),
          },
        } as AMInputFieldConfigMap;

        return fields;
      },
      amEnter(node, transaction, stack) {
        const context = new AMDataContext();
        stack.push(context);
      },
      amLeave(node, transaction, stack) {
        const operation = stack.lastOperation();
        const path = stack.dbPath(operation).asString();
        const context = stack.pop() as AMDataContext;
        const lastInStack = stack.last();

        const data = stack.getOperationData(operation);
        if (!context.data || Object.keys(context.data).length != 1) {
          throw new Error(`${typeName} should contain one filled field`);
        }

        if (context.data.create) {
          const push = (data.data && data.data['$push']) || {};
          data.addValue('$push', push);
          push[path] = { $each: context.data.create };
        }

        if (context.data.connect) {
          const push = (data.data && data.data['$push']) || {};
          data.addValue('$push', push);
          push[path] = { $each: context.data.connect };
        }

        if (context.data.connectOnce) {
          const push = (data.data && data.data['$addToSet']) || {};
          data.addValue('$addToSet', push);
          push[path] = { $each: context.data.connectOnce };
        }

        if (context.data.disconnect) {
          const pullAll = (data.data && data.data['$pullAll']) || {};
          data.addValue('$pullAll', pullAll);
          pullAll[path] = context.data.disconnect;
        }

        if (context.data.delete) {
          const pullAll = (data.data && data.data['$pullAll']) || {};
          data.addValue('$pullAll', pullAll);
          pullAll[path] = context.data.delete;
        }

        if (context.data.recreate) {
          if (lastInStack instanceof AMObjectFieldContext) {
            lastInStack.setValue(context.data.recreate);
          }
        }

        if (context.data.reconnect) {
          if (lastInStack instanceof AMObjectFieldContext) {
            lastInStack.setValue(context.data.reconnect);
          }
        }
      },
    });
  }
}
