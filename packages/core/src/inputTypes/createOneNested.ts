import { GraphQLInputObjectType, ObjectFieldNode } from 'graphql';
import R from 'ramda';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import {
  AMInputObjectType,
  AMModelField,
  IAMInputFieldFactory,
  IAMTypeFactory,
} from '../types';
import { AMCreateTypeFactory } from './create';

const isApplicable = (field: AMModelField) => (
  fieldFactory: IAMInputFieldFactory
) => fieldFactory.isApplicable(field);

export const AMCreateOneNestedTypeFactory: IAMTypeFactory<
  GraphQLInputObjectType
> = {
  getTypeName(modelType): string {
    return `${modelType.name}CreateOneNestedInput`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMTypeFactory<AMInputObjectType> = this;
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {
          create: {
            type: schemaInfo.resolveFactoryType(modelType, AMCreateTypeFactory),
          },
        };

        return fields;
      },
      // we can keep this empty because child object will pass value to parent directly
      // amEnter(node: ObjectFieldNode, transaction, stack) {
      //   const action = new AMObjectFieldContext();
      //   stack.push(action);
      // },
      // amLeave(node, transaction, stack) {
      //   const context = stack.pop() as AMObjectFieldContext;
      //   const lastInStack = R.last(stack);

      //   //pass value without 'create' key
      //   if (lastInStack instanceof AMObjectFieldContext) {
      //     lastInStack.setValue(context.value);
      //   }
      // },
    });
  },
};
