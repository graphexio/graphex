import { getNamedType, isCompositeType } from 'graphql';
import { AMInputField, IAMInputFieldFactory } from '../../definitions';
import { updateObjectFieldVisitorHandler } from '../visitorHandlers';
import { AMObjectFieldContext } from '../../execution/contexts/objectField';
import {
  getLastOperation,
  getFieldPath,
  getOperationData,
} from '../../execution/utils';
import TypeWrap from '@apollo-model/type-wrap';

export const AMUpdateFieldFactory: IAMInputFieldFactory = {
  isApplicable(field) {
    return (
      !isCompositeType(getNamedType(field.type)) &&
      !field.isID &&
      !field.isReadOnly
    );
  },
  getFieldName(field) {
    return field.name;
  },
  getField(field, schemaInfo) {
    return <AMInputField>{
      name: this.getFieldName(field),
      type: new TypeWrap(field.type).setRequired(false).type(),
      amEnter(node, transaction, stack) {
        const action = new AMObjectFieldContext(field.dbName);
        stack.push(action);
      },
      amLeave(node, transaction, stack) {
        const operation = getLastOperation(stack);
        const path = getFieldPath(stack, operation);
        const context = stack.pop() as AMObjectFieldContext;

        const data = getOperationData(stack, operation);
        const set = (data.data && data.data['$set']) || {};
        data.addValue('$set', set);
        set[path] = context.value;
      },
    };
  },
};
