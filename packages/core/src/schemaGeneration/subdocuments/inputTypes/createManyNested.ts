import { GraphQLList } from 'graphql';
import {
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
} from '../../../definitions';

export class AMCreateManyNestedTypeFactory extends AMTypeFactory<AMInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}CreateManyNestedInput`;
  }
  getType(modelType: AMModelType) {
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
            // we can keep amEnter and amLeave empty because child object will pass value to parent directly
          },
        };

        return fields;
      },
    });
  }
}
