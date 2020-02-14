import {
  GraphQLInputObjectType,
  GraphQLList,
  ObjectFieldNode,
  isInterfaceType,
} from 'graphql';
import {
  AMModelField,
  IAMInputFieldFactory,
  IAMTypeFactory,
  AMInputObjectType,
  AMInputField,
  AMInputFieldConfigMap,
} from '../definitions';
import { AMCreateTypeFactory } from './create';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import R from 'ramda';
import { AMInterfaceCreateTypeFactory } from './interfaceCreate';

import { AMTypeFactory, AMModelType } from '../definitions';
export class AMCreateManyNestedTypeFactory extends AMTypeFactory<
  AMInputObjectType
> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}CreateManyNestedInput`;
  }
  getType(modelType: AMModelType) {
    const createTypeFactory = !isInterfaceType(modelType)
      ? AMCreateTypeFactory
      : AMInterfaceCreateTypeFactory;

    const self: IAMTypeFactory<AMInputObjectType> = this;
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = <AMInputFieldConfigMap>{
          create: {
            type: new GraphQLList(
              this.schemaInfo.resolveFactoryType(modelType, createTypeFactory)
            ),
            // we can keep amEnter and amLeave empty because child object will pass value to parent directly
          },
        };

        return fields;
      },
    });
  }
}
