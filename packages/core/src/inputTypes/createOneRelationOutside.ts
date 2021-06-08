import { toArray } from 'lodash';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
} from '../definitions';
import { AMDataContext } from '../execution';
import { defaultObjectFieldVisitorHandler } from './visitorHandlers';

export class AMCreateOneRelationOutsideTypeFactory extends AMTypeFactory<AMInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}CreateOneRelationOutsideInput`;
  }
  getType(modelType: AMModelType) {
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        return {
          connect: {
            type: this.configResolver.resolveInputType(modelType, [
              'whereUniqueExternal',
              'interfaceWhereUniqueExternal',
            ]),
            ...defaultObjectFieldVisitorHandler('connect'),
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

        const data = stack.getOperationData(operation);

        if (context.data.connect) {
          data.addValue(
            path,
            context.data.connect[modelType?.mmUniqueFields?.[0]?.name]
          );
        }
      },
    });
  }
}
