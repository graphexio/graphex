import TypeWrap from '@apollo-model/type-wrap';
import { getNamedType, isCompositeType } from 'graphql';
import { AMInputField, AMInputFieldFactory } from '../../definitions';
import { AMObjectFieldContext } from '../../execution/contexts/objectField';
import {
  getFieldPath,
  getLastOperation,
  getOperationData,
} from '../../execution/utils';

export class AMUpdateFieldFactory extends AMInputFieldFactory {
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
  }
}
