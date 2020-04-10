import { GraphQLList } from 'graphql';
import { DBRef } from 'mongodb';
import R from 'ramda';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
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
import {
  getFieldPath,
  getLastOperation,
  getOperationData,
} from '../execution/utils';

export class AMUpdateManyRelationTypeFactory extends AMTypeFactory<
  AMInputObjectType
> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}UpdateManyRelationInput`;
  }
  getType(modelType: AMModelType) {
    const typeName = this.getTypeName(modelType);

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
                        opContext
                          .getOutput()
                          .map(new ResultPromiseTransforms.Path('insertedIds'))
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
              this.configResolver.resolveInputType(modelType, [
                'create',
                'interfaceCreate',
              ])
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
                        opContext
                          .getOutput()
                          .map(new ResultPromiseTransforms.Path('insertedIds'))
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
              this.configResolver.resolveInputType(modelType, [
                'whereUnique',
                'interfaceWhereUnique',
              ])
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
                          .map(
                            new ResultPromiseTransforms.Distinct(
                              objectFieldContext.field.relation.relationField
                            )
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
              this.configResolver.resolveInputType(modelType, [
                'whereUnique',
                'interfaceWhereUnique',
              ])
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
                          .map(
                            new ResultPromiseTransforms.Distinct(
                              objectFieldContext.field.relation.relationField
                            )
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
              this.configResolver.resolveInputType(modelType, [
                'whereUnique',
                'interfaceWhereUnique',
              ])
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
              this.configResolver.resolveInputType(modelType, [
                'whereUnique',
                'interfaceWhereUnique',
              ])
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
        } as AMInputFieldConfigMap;

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
  }
}
