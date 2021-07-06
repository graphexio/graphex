import { GraphQLInputObjectType, GraphQLList } from 'graphql';
import {
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
} from '../../../definitions';
import { AMDataContext } from '../../../execution/contexts/data';
import { defaultObjectFieldVisitorHandler } from '../../common/visitorHandlers';
import { updateObjectFieldVisitorHandler } from './visitorHandlers';

export class AMUpdateManyNestedTypeFactory extends AMTypeFactory<GraphQLInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}UpdateManyNestedInput`;
  }
  getType(modelType: AMModelType) {
    const typeName = this.getTypeName(modelType);

    return new AMInputObjectType({
      name: typeName,
      fields: () => {
        const fields = {
          create: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(modelType, this.links.create)
            ),
            ...updateObjectFieldVisitorHandler('create', 'pushEach'),
          },
          recreate: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(
                modelType,
                this.links.recreate
              )
            ),
            ...updateObjectFieldVisitorHandler('recreate', 'set'),
          },
          updateMany: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(
                modelType,
                this.links.updateMany //AMUpdateWithWhereNestedTypeFactory
              )
            ),
            amLeave(node, transaction, stack) {
              const lastInStack = stack.last();
              if (lastInStack instanceof AMDataContext) {
                lastInStack.addValue('updateMany', true);
              }
            },
          },
          deleteMany: {
            type: new GraphQLList(
              this.configResolver.resolveInputType(
                modelType,
                this.links.deleteMany //AMWhereTypeFactory
              )
            ),
            ...defaultObjectFieldVisitorHandler('deleteMany'),
          },
        };

        return fields;
      },
      amEnter(node, transaction, stack) {
        const context = new AMDataContext();
        stack.push(context);
      },
      amLeave(node, transaction, stack) {
        const context = stack.pop() as AMDataContext;

        if (!context.data || Object.keys(context.data).length != 1) {
          throw new Error(`${typeName} should contain one field`);
        }
      },
    });
  }
}
