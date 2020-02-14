import { GraphQLInputObjectType, isInterfaceType } from 'graphql';
import {
  AMInputObjectType,
  AMModelField,
  AMModelType,
  AMTypeFactory,
  IAMInputFieldFactory,
  IAMTypeFactory,
} from '../definitions';
import { AMCreateTypeFactory } from './create';
import { AMInterfaceCreateTypeFactory } from './interfaceCreate';

export class AMCreateOneNestedTypeFactory extends AMTypeFactory<
  GraphQLInputObjectType
> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}CreateOneNestedInput`;
  }
  getType(modelType: AMModelType) {
    const createTypeFactory = !isInterfaceType(modelType)
      ? AMCreateTypeFactory
      : AMInterfaceCreateTypeFactory;

    const self: IAMTypeFactory<AMInputObjectType> = this;
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {
          create: {
            type: this.schemaInfo.resolveFactoryType(
              modelType,
              createTypeFactory
            ),
          },
        };

        return fields;
      },
      // we can keep this empty because child object will pass value to parent directly
    });
  }
}
