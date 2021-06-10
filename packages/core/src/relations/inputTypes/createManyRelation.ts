import { GraphQLInputObjectType, GraphQLList } from 'graphql';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
} from '../../definitions';
import { AMDataContext, AMObjectFieldContext } from '../../execution';
import {
  createManyHandlerFactory,
  readManyHandlerFactory,
} from '../visitorHandlers';

export class AMCreateManyRelationTypeFactory extends AMTypeFactory<GraphQLInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}CreateManyRelationInput`;
  }
  getType(modelType: AMModelType) {
    const readHandler = readManyHandlerFactory(modelType);
    const createHandler = createManyHandlerFactory(modelType);

    return new AMInputObjectType({
      name: this.getTypeName(modelType),
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
          connect: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, [
                'whereUnique',
                'interfaceWhereUnique',
              ])
            ),
            ...readHandler('connect'),
          },
        } as AMInputFieldConfigMap;

        return fields;
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
