import {
  GraphQLInputObjectType,
  ObjectFieldNode,
  GraphQLInterfaceType,
} from 'graphql';
import R from 'ramda';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import {
  AMInputObjectType,
  AMModelField,
  IAMInputFieldFactory,
  IAMTypeFactory,
  AMInputFieldConfig,
  AMObjectType,
  AMModelType,
  AMInterfaceType,
} from '../types';
import { AMCreateTypeFactory } from './create';
import { AMDataContext } from '../execution/contexts/data';
import { AMCreateOperation } from '../execution/operations/createOperation';

export const AMInterfaceCreateTypeFactory: IAMTypeFactory<
  GraphQLInputObjectType
> = {
  getTypeName(modelType): string {
    return `${modelType.name}InterfaceCreateInput`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMTypeFactory<AMInputObjectType> = this;

    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {};
        if (modelType instanceof GraphQLInterfaceType) {
          schemaInfo.schema
            .getPossibleTypes(modelType)
            .forEach((possibleType: AMObjectType) => {
              fields[possibleType.name] = <AMInputFieldConfig>{
                type: schemaInfo.resolveFactoryType(
                  possibleType,
                  AMCreateTypeFactory
                ),
                // amEnter(node, transaction, stack) {
                //   },
                amLeave(node, transaction, stack) {
                  const lastInStack = R.last(stack);
                  if (lastInStack instanceof AMCreateOperation) {
                    if (lastInStack.data) {
                      lastInStack.data.addValue(
                        modelType.mmDiscriminatorField,
                        possibleType.mmDiscriminator
                      );
                    }
                  }
                },
              };
            });
        }

        return fields;
      },
    });
  },
};
