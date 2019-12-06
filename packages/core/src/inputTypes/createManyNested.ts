import { GraphQLInputObjectType, GraphQLList, ObjectFieldNode } from 'graphql';
import {
  AMModelField,
  IAMInputFieldFactory,
  IAMTypeFactory,
  AMInputObjectType,
  AMInputField,
  AMInputFieldConfigMap,
} from '../types';
import { AMCreateTypeFactory } from './create';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import R from 'ramda';

const isApplicable = (field: AMModelField) => (
  fieldFactory: IAMInputFieldFactory
) => fieldFactory.isApplicable(field);

export const AMCreateManyNestedTypeFactory: IAMTypeFactory<
  AMInputObjectType
> = {
  getTypeName(modelType): string {
    return `${modelType.name}CreateManyNestedInput`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMTypeFactory<AMInputObjectType> = this;
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = <AMInputFieldConfigMap>{
          create: {
            type: new GraphQLList(
              schemaInfo.resolveFactoryType(modelType, AMCreateTypeFactory)
            ),
            // we can keep amEnter and amLeave empty because child object will pass value to parent directly
          },
        };

        return fields;
      },
    });
  },
};
