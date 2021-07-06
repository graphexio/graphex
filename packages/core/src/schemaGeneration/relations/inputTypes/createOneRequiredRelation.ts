import { UserInputError } from 'apollo-server'; // TODO: replace with custom class
import { InputObjectTypeDefinitionNode } from 'graphql';
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

export class AMCreateOneRequiredRelationTypeFactory extends AMTypeFactory<AMInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}CreateOneRequiredRelationInput`;
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
        };
      },
      amEnter(node: InputObjectTypeDefinitionNode, transaction, stack) {
        if (node.fields.length != 1) {
          throw new UserInputError(`'create' or 'connect' needed`);
        }
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
