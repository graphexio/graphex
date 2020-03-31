import {
  GraphQLInputObjectType,
  ObjectFieldNode,
  isInterfaceType,
} from 'graphql';
import R from 'ramda';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import {
  AMInputObjectType,
  AMModelField,
  IAMInputFieldFactory,
  IAMTypeFactory,
} from '../definitions';
import { AMCreateTypeFactory } from './create';
import { AMUpdateTypeFactory } from './update';
import { AMInterfaceCreateTypeFactory } from './interfaceCreate';

const isApplicable = (field: AMModelField) => (
  fieldFactory: IAMInputFieldFactory
) => fieldFactory.isApplicable(field);

import { AMTypeFactory, AMModelType } from '../definitions';

export class AMUpdateOneNestedTypeFactory extends AMTypeFactory<
  GraphQLInputObjectType
> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}UpdateOneNestedInput`;
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
          update: {
            type: this.schemaInfo.resolveFactoryType(
              modelType,
              AMUpdateTypeFactory
            ),
          },
        };

        return fields;
      },
    });
  }
}
