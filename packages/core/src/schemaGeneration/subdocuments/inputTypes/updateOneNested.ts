import { GraphQLInputObjectType } from 'graphql';
import {
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
} from '../../../definitions';
import { updateObjectFieldVisitorHandler } from './visitorHandlers';

export class AMUpdateOneNestedTypeFactory extends AMTypeFactory<GraphQLInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}UpdateOneNestedInput`;
  }
  getType(modelType: AMModelType) {
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => ({
        create: {
          type: this.configResolver.resolveInputType(modelType, [
            'create',
            'interfaceCreate',
          ]),
          ...updateObjectFieldVisitorHandler('create', 'set'),
        },
        update: {
          type: this.configResolver.resolveInputType(modelType, ['update']),
        },
      }),
    });
  }
}
