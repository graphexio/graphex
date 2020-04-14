import {
  AMInputField,
  AMInputFieldFactory,
  AMModelField,
  AMObjectFieldContext,
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
        const operation = stack.lastOperation();
        const path = stack.getFieldPath(operation);
        const context = stack.pop() as AMObjectFieldContext;

        const data = stack.getOperationData(operation);
        const set = (data.data && data.data['$set']) || {};
        data.addValue('$set', set);
        set[path] = context.value;
      },
    } as AMInputField;
  }
}
