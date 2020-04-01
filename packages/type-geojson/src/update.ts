import {
  getFieldPath,
  getLastOperation,
  getOperationData,
} from '@apollo-model/core/lib/execution/utils';
import {
  AMInputField,
  AMInputFieldFactory,
  AMObjectFieldContext,
  AMModelField,
} from '@apollo-model/core';
import { GraphQLNamedType } from 'graphql';

export class AMGeoJSONUpdateFieldFactory extends AMInputFieldFactory {
  isApplicable() {
    return true;
  }
  getFieldName(field: AMModelField) {
    return `${field.name}`;
  }
  getField(field) {
    return {
      name: this.getFieldName(field),
      type: this.schemaInfo.schema.getType(
        `${(field.type as GraphQLNamedType).name}Input`
      ),
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
    } as AMInputField;
  }
}
