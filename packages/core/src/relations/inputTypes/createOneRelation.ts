import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
} from '../../definitions';
import { AMDataContext } from '../../execution';
import { AMObjectFieldContext } from '../../execution/contexts/objectField';
import {
  createOneHandlerFactory,
  readOneHandlerFactory,
} from '../visitorHandlers';

export class AMCreateOneRelationTypeFactory extends AMTypeFactory<AMInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}CreateOneRelationInput`;
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
        const context = stack.pop() as AMDataContext;

        const lastInStack = stack.last();
        if (lastInStack instanceof AMObjectFieldContext) {
          lastInStack.setValue(context.data.connect ?? context.data.create);
        }
      },
    });
  }
}
