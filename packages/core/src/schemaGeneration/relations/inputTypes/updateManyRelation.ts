import { GraphQLList } from 'graphql';
import { DBRef } from 'mongodb';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
} from '../../../definitions';
import { AMDataContext } from '../../../execution/contexts/data';
import { AMListValueContext } from '../../../execution/contexts/listValue';
import { AMObjectFieldContext } from '../../../execution/contexts/objectField';
import { AMDeleteDBRefOperation } from '../../../execution/operations/deleteDbRefOperation';
import { AMResultPromise } from '../../../execution/resultPromise';

import {
  readManyHandlerFactory,
  createManyHandlerFactory,
} from '../visitorHandlers';

export class AMUpdateManyRelationTypeFactory extends AMTypeFactory<AMInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}UpdateManyRelationInput`;
  }

  // TODO: Refactor mmEnter, mmLeave

  getType(modelType: AMModelType) {
    const typeName = this.getTypeName(modelType);

    const readHandler = readManyHandlerFactory(modelType);
    const createHandler = createManyHandlerFactory(modelType);

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
            ...readHandler('connect'),
          },
          connectOnce: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, [
                'whereUnique',
                'interfaceWhereUnique',
              ])
            ),
            ...readHandler('connectOnce'),
          },
          reconnect: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, [
                'whereUnique',
                'interfaceWhereUnique',
              ])
            ),
            ...readHandler('reconnect'),
          },
          disconnect: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, [
                'whereUnique',
                'interfaceWhereUnique',
              ])
            ),
            ...readHandler('disconnect'),
          },
          delete: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, [
                'whereUnique',
                'interfaceWhereUnique',
              ])
            ),
            ...readHandler('delete'),
            ...(!modelType.mmAbstract
              ? {
                  //TODO: !!!!!! https://gitlab.com/graphexio/graphex/-/issues/6
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

        const data = operation.data;
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
          const set = (data.data && data.data['$set']) || {};
          data.addValue('$set', set);
          set[path] = context.data.recreate;
        }

        if (context.data.reconnect) {
          const set = (data.data && data.data['$set']) || {};
          data.addValue('$set', set);
          set[path] = context.data.reconnect;
        }
      },
    });
  }
}
