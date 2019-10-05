import { getNamedType, isCompositeType } from 'graphql';
import { AMInputField, IAMInputFieldFactory } from '../../types';
import { defaultObjectFieldVisitorHandler } from '../visitorHandlers';

export const AMCreateFieldFactory: IAMInputFieldFactory = {
  isApplicable(field) {
    return !isCompositeType(getNamedType(field.type)) && !field.isID;
  },
  getFieldName(field) {
    return field.name;
  },
  getField(field, schemaInfo) {
    return <AMInputField>{
      name: this.getFieldName(field),
      type: field.type,
      ...defaultObjectFieldVisitorHandler(field),
      // amEnter(node: ObjectFieldNode, transaction, stack) {
      //   const action = new AMObjectFieldContext(field.dbName);
      //   stack.push(action);
      // },
      // amLeave(node, transaction, stack) {
      //   const context = stack.pop() as AMObjectFieldContext;

      //   const lastInStack = R.last(stack);
      //   if (lastInStack instanceof AMDataContext) {
      //     lastInStack.addValue(context.fieldName, context.value);
      //   }
      // },
    };
  },
};
