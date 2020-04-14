import { getNamedType, isCompositeType } from 'graphql';
import { AMInputFieldFactory } from '../../definitions';
import { defaultObjectFieldVisitorHandler } from '../visitorHandlers';

export class AMCreateFieldFactory extends AMInputFieldFactory {
  isApplicable(field) {
    return (
      !isCompositeType(getNamedType(field.type)) &&
      !field.isID &&
      !field.isReadOnly
    );
  }
  getFieldName(field) {
    return field.name;
  }
  getField(field) {
    return {
      name: this.getFieldName(field),
      extensions: undefined,
      type: field.defaultValue ? getNamedType(field.type) : field.type,
      ...defaultObjectFieldVisitorHandler(field.dbName),
      // amEnter(node: ObjectFieldNode, transaction, stack) {
      //   const action = new AMObjectFieldContext(field.dbName);
      //   stack.push(action);
      // },
      // amLeave(node, transaction, stack) {
      //   const context = stack.pop() as AMObjectFieldContext;

      //   const lastInStack = stack.last();
      //   if (lastInStack instanceof AMDataContext) {
      //     lastInStack.addValue(context.fieldName, context.value);
      //   }
      // },
    };
  }
}
