import {
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
} from '../../../definitions';
import { AMDataContext } from '../../../execution';
import { defaultObjectFieldVisitorHandler } from '../../common/visitorHandlers';

export class AMUpdateOneRelationOutsideTypeFactory extends AMTypeFactory<AMInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}UpdateOneRelationOutsideInput`;
  }
  getType(modelType: AMModelType) {
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => ({
        connect: {
          type: this.configResolver.resolveInputType(modelType, [
            'whereUniqueExternal',
            'interfaceWhereUnique',
          ]),
          ...defaultObjectFieldVisitorHandler('connect'),
        },
      }),
      amEnter(node, transaction, stack) {
        const context = new AMDataContext();
        stack.push(context);
      },
      amLeave(node, transaction, stack) {
        const operation = stack.lastOperation();
        const path = stack.dbPath(operation).asString();
        const context = stack.pop() as AMDataContext;

        const data = operation.data;

        if (context.data?.connect) {
          const set = (data.data && data.data['$set']) || {};
          data.addValue('$set', set);
          set[path] =
            context.data.connect?.[modelType?.mmUniqueFields?.[0]?.name];
        }
      },
    });
  }
}
