import { GraphQLList } from 'graphql';
import { toArray } from 'lodash';
import { map, prop } from 'ramda';
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
        const path = stack.dbPath(operation).asString();
        const context = stack.pop() as AMDataContext;

        const mapKey = map(prop(modelType?.mmUniqueFields?.[0]?.name));

        const data = stack.getOperationData(operation);
        if (!context.data || Object.keys(context.data).length != 1) {
          throw new Error(`${typeName} should contain one field`);
        }

        if (context.data.connect) {
          const push = (data.data && data.data['$push']) || {};
          data.addValue('$push', push);
          push[path] = {
            $each: mapKey(toArray(context.data.connect as Record<string, any>)),
          };
        }

        if (context.data.reconnect) {
          const set = (data.data && data.data['$set']) || {};
          data.addValue('$set', set);
          set[path] = mapKey(
            toArray(context.data.reconnect as Record<string, any>)
          );
        }

        if (context.data.disconnect) {
          const pullAll = (data.data && data.data['$pullAll']) || {};
          data.addValue('$pullAll', pullAll);
          pullAll[path] = mapKey(
            toArray(context.data.disconnect as Record<string, any>)
          );
        }
      },
    });
  }
}
