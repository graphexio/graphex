import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
} from '../../../definitions';
import { AMDataContext } from '../../../execution';
import { AMObjectFieldContext } from '../../../execution/contexts/objectField';
import {
  createOneHandlerFactory,
  readOneHandlerFactory,
} from '../visitorHandlers';

export class AMUpdateOneRelationTypeFactory extends AMTypeFactory<AMInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}UpdateOneRelationInput`;
  }
  getType(modelType: AMModelType) {
    const readHandler = readOneHandlerFactory(modelType);
    const createHandler = createOneHandlerFactory(modelType);

    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        return {
          create: {
            type: this.configResolver.resolveInputType(modelType, [
              'create',
              'interfaceCreate',
            ]),
            ...createHandler('create'),
          },
          connect: {
            type: this.configResolver.resolveInputType(modelType, [
              'whereUnique',
              'interfaceWhereUnique',
            ]),
            ...readHandler('connect'),
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
        if (!context.data || Object.keys(context.data).length != 1) {
          throw new Error(
            `${this.getTypeName(modelType)} should contain one filled field`
          );
        }

        if (context.data.create || context.data.connect) {
          const set = (data.data && data.data['$set']) || {};
          data.addValue('$set', set);
          set[path] = context.data.create ?? context.data.connect;
        }
      },
    });
  }
}
