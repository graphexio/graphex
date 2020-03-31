import { GraphQLList } from 'graphql';
import {
  AMInputFieldConfigMap,
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
  IAMTypeFactory,
} from '../definitions';

export class AMCreateManyNestedTypeFactory extends AMTypeFactory<
  AMInputObjectType
> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}CreateManyNestedInput`;
  }
  getType(modelType: AMModelType) {
    const self: IAMTypeFactory<AMInputObjectType> = this;
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = <AMInputFieldConfigMap>{
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
