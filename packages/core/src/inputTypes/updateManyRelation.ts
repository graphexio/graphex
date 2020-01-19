import { GraphQLInputObjectType, GraphQLList, isInterfaceType } from 'graphql';
import R from 'ramda';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { AMSelectorContext } from '../execution/contexts/selector';
import { AMReadOperation } from '../execution/operations/readOperation';
import {
  AMModelField,
  IAMInputFieldFactory,
  IAMTypeFactory,
  AMInputFieldMap,
  AMInputFieldConfigMap,
  AMInputObjectType,
} from '../definitions';
import { AMCreateTypeFactory } from './create';
import { AMWhereUniqueTypeFactory } from './whereUnique';
import { AMInterfaceCreateTypeFactory } from './interfaceCreate';
import { AMCreateOperation } from '../execution/operations/createOperation';
import { AMListValueContext } from '../execution/contexts/listValue';
import { AMDataContext } from '../execution/contexts/data';
import {
  getLastOperation,
  getFieldPath,
  getOperationData,
} from '../execution/utils';
import { toArray } from '../tsutils';
import { AMInterfaceWhereUniqueTypeFactory } from './interfaceWhereUnique';
import { AMDeleteDBRefOperation } from '../execution/operations/deleteDbRefOperation';
import { AMResultPromise } from '../execution/resultPromise';
import { DBRef } from 'mongodb';

const isApplicable = (field: AMModelField) => (
  fieldFactory: IAMInputFieldFactory
) => fieldFactory.isApplicable(field);

export const AMUpdateManyRelationTypeFactory: IAMTypeFactory<AMInputObjectType> = {
  getTypeName(modelType): string {
    return `${modelType.name}UpdateManyRelationInput`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMTypeFactory<AMInputObjectType> = this;
    const createTypeFactory = !isInterfaceType(modelType)
      ? AMCreateTypeFactory
      : AMInterfaceCreateTypeFactory;

    const whereTypeFactory = !isInterfaceType(modelType)
      ? AMWhereUniqueTypeFactory
      : AMInterfaceWhereUniqueTypeFactory;

    const typeName = this.getTypeName(modelType);

    return new AMInputObjectType({
      name: typeName,
      fields: () => {
        const fields = <AMInputFieldConfigMap>{
          create: {
            type: new GraphQLList(
              schemaInfo.resolveFactoryType(modelType, createTypeFactory)
            ),
            /* For abstract interface we make separate operation for each document */
            ...(!modelType.mmAbstract
              ? {
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

                    const lastInStack = R.last(stack);
                    if (lastInStack instanceof AMDataContext) {
                      lastInStack.addValue(
                        'create',
                        opContext.getOutput().path('insertedIds')
                      );
                    }
                  },
                }
              : {
                  amEnter(node, transaction, stack) {
                    const listContext = new AMListValueContext();
                    listContext.setProxy(true);
                    stack.push(listContext);
                  },
                  amLeave(node, transaction, stack) {
                    const listContext = stack.pop() as AMListValueContext;
                    const lastInStack = R.last(stack);
                    if (lastInStack instanceof AMDataContext) {
                      lastInStack.addValue('create', listContext.values);
                    }
                  },
                }),
          },
          recreate: {
            type: new GraphQLList(
              schemaInfo.resolveFactoryType(modelType, createTypeFactory)
            ),
            /* For abstract interface we make separate operation for each document */
            ...(!modelType.mmAbstract
              ? {
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

                    const lastInStack = R.last(stack);
                    if (lastInStack instanceof AMDataContext) {
                      lastInStack.addValue(
                        'recreate',
                        opContext.getOutput().path('insertedIds')
                      );
                    }
                  },
                }
              : {
                  amEnter(node, transaction, stack) {
                    const listContext = new AMListValueContext();
                    listContext.setProxy(true);
                    stack.push(listContext);
                  },
                  amLeave(node, transaction, stack) {
                    const listContext = stack.pop() as AMListValueContext;
                    const lastInStack = R.last(stack);
                    if (lastInStack instanceof AMDataContext) {
                      lastInStack.addValue('recreate', listContext.values);
                    }
                  },
                }),
          },
          connect: {
            type: new GraphQLList(
              schemaInfo.resolveFactoryType(modelType, whereTypeFactory)
            ),
            /* For abstract interface we make separate operation for each document */
            ...(!modelType.mmAbstract
              ? {
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

                    selectorContext.addValue(
                      orContext.fieldName,
                      orContext.value
                    );

                    opContext.setSelector(selectorContext);

                    const lastInStack = R.last(stack);
                    if (lastInStack instanceof AMDataContext) {
                      const objectFieldContext = R.last(
                        R.dropLast(1, stack)
                      ) as AMObjectFieldContext;

                      lastInStack.addValue(
                        'connect',
                        opContext
                          .getOutput()
                          .distinct(
                            objectFieldContext.field.relation.relationField
                          )
                      );
                    }
                  },
                }
              : {
                  amEnter(node, transaction, stack) {
                    const listContext = new AMListValueContext();
                    stack.push(listContext);
                  },
                  amLeave(node, transaction, stack) {
                    const listContext = stack.pop() as AMListValueContext;
                    const lastInStack = R.last(stack);
                    if (lastInStack instanceof AMDataContext) {
                      lastInStack.addValue('connect', listContext.values);
                    }
                  },
                }),
          },
          reconnect: {
            type: new GraphQLList(
              schemaInfo.resolveFactoryType(modelType, whereTypeFactory)
            ),
            /* For abstract interface we make separate operation for each document */
            ...(!modelType.mmAbstract
              ? {
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

                    selectorContext.addValue(
                      orContext.fieldName,
                      orContext.value
                    );

                    opContext.setSelector(selectorContext);

                    const lastInStack = R.last(stack);
                    if (lastInStack instanceof AMDataContext) {
                      const objectFieldContext = R.last(
                        R.dropLast(1, stack)
                      ) as AMObjectFieldContext;

                      lastInStack.addValue(
                        'reconnect',
                        opContext
                          .getOutput()
                          .distinct(
                            objectFieldContext.field.relation.relationField
                          )
                      );
                    }
                  },
                }
              : {
                  amEnter(node, transaction, stack) {
                    const listContext = new AMListValueContext();
                    stack.push(listContext);
                  },
                  amLeave(node, transaction, stack) {
                    const listContext = stack.pop() as AMListValueContext;
                    const lastInStack = R.last(stack);
                    if (lastInStack instanceof AMDataContext) {
                      lastInStack.addValue('reconnect', listContext.values);
                    }
                  },
                }),
          },
          disconnect: {
            type: new GraphQLList(
              schemaInfo.resolveFactoryType(modelType, whereTypeFactory)
            ),
            ...(!modelType.mmAbstract
              ? {
                  //TODO: fix connect first, then copy
                }
              : {
                  amEnter(node, transaction, stack) {
                    const listContext = new AMListValueContext();
                    stack.push(listContext);
                  },
                  amLeave(node, transaction, stack) {
                    const listContext = stack.pop() as AMListValueContext;
                    const lastInStack = R.last(stack);
                    if (lastInStack instanceof AMDataContext) {
                      lastInStack.addValue('disconnect', listContext.values);
                    }
                  },
                }),
          },
          delete: {
            type: new GraphQLList(
              schemaInfo.resolveFactoryType(modelType, whereTypeFactory)
            ),
            ...(!modelType.mmAbstract
              ? {
                  //TODO: fix connect first, then copy
                }
              : {
                  amEnter(node, transaction, stack) {
                    const listContext = new AMListValueContext();
                    stack.push(listContext);
                  },
                  amLeave(node, transaction, stack) {
                    const listContext = stack.pop() as AMListValueContext;
                    const deleteOperation = new AMDeleteDBRefOperation(
                      transaction,
                      {
                        many: true,
                        dbRefList: listContext.values as AMResultPromise<
                          DBRef
                        >[],
                      }
                    );

                    const lastInStack = R.last(stack);
                    if (lastInStack instanceof AMDataContext) {
                      lastInStack.addValue('delete', listContext.values);
                    }
                  },
                }),
          },
        };

        return fields;
      },
      amEnter(node, transaction, stack) {
        const context = new AMDataContext();
        stack.push(context);
      },
      amLeave(node, transaction, stack) {
        const operation = getLastOperation(stack);
        const path = getFieldPath(stack, operation);
        const context = stack.pop() as AMDataContext;
        const lastInStack = R.last(stack);

        const data = getOperationData(stack, operation);
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
  },
};
