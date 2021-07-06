import { GraphQLInputObjectType } from 'graphql';
import {
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
} from '../../../definitions';

export class AMCreateOneNestedTypeFactory extends AMTypeFactory<GraphQLInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}CreateOneNestedInput`;
  }
  getType(modelType: AMModelType) {
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        return {
          create: {
            type: this.configResolver.resolveInputType(modelType, [
              'create',
              'interfaceCreate',
            ]),
          },
        };
      },
      // we can keep this empty because child object will pass value to parent directly
    });
  }
}
