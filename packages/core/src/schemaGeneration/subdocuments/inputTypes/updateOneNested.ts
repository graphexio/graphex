import { GraphQLInputObjectType } from 'graphql';
import {
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
} from '../../../definitions';

export class AMUpdateOneNestedTypeFactory extends AMTypeFactory<GraphQLInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}UpdateOneNestedInput`;
  }
  getType(modelType: AMModelType) {
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {
          create: {
            type: this.configResolver.resolveInputType(modelType, [
              'create',
              'interfaceCreate',
            ]),
          },
          update: {
            type: this.configResolver.resolveInputType(modelType, ['update']),
          },
        };

        return fields;
      },
    });
  }
}
