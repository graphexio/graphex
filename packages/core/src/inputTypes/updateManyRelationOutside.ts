import { GraphQLList } from 'graphql';
import { toArray } from 'lodash';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
} from '../definitions';
import { AMDataContext } from '../execution';
import { defaultObjectFieldVisitorHandler } from './visitorHandlers';

export class AMUpdateManyRelationOutsideTypeFactory extends AMTypeFactory<AMInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}UpdateManyRelationOutsideInput`;
  }

  getType(modelType: AMModelType) {
    const typeName = this.getTypeName(modelType);

    return new AMInputObjectType({
      name: typeName,
      fields: () => {
        return {
          connect: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, [
                'whereUniqueExternal',
                'interfaceWhereUnique',
              ])
            ),
            ...defaultObjectFieldVisitorHandler('connect'),
          },
          reconnect: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, [
                'whereUniqueExternal',
                'interfaceWhereUnique',
              ])
            ),
            ...defaultObjectFieldVisitorHandler('reconnect'),
          },
          disconnect: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, [
                'whereUniqueExternal',
                'interfaceWhereUnique',
              ])
            ),
            ...defaultObjectFieldVisitorHandler('disconnect'),
          },
        } as AMInputFieldConfigMap;
      },
      amEnter(node, transaction, stack) {
        const context = new AMDataContext();
        stack.push(context);
      },
      amLeave(node, transaction, stack) {
        const operation = stack.lastOperation();
        const path = stack.path(operation).asString();
        const context = stack.pop() as AMDataContext;

        const data = stack.getOperationData(operation);
        if (!context.data || Object.keys(context.data).length != 1) {
          throw new Error(`${typeName} should contain one field`);
        }

        if (context.data.connect) {
          const push = (data.data && data.data['$push']) || {};
          data.addValue('$push', push);
          push[path] = { $each: toArray(context.data.connect) };
        }

        if (context.data.reconnect) {
          const set = (data.data && data.data['$set']) || {};
          data.addValue('$set', set);
          set[path] = toArray(context.data.reconnect);
        }

        if (context.data.disconnect) {
          const pullAll = (data.data && data.data['$pullAll']) || {};
          data.addValue('$pullAll', pullAll);
          pullAll[path] = context.data.disconnect;
        }
      },
    });
  }
}
