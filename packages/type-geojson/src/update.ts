import { defaultObjectFieldVisitorHandler } from '@apollo-model/core/lib/inputTypes/visitorHandlers';
import {
  AMInputField,
  IAMInputFieldFactory,
} from '@apollo-model/core/src/definitions';
import { GraphQLNamedType } from 'graphql';
import { AMObjectFieldContext } from '@apollo-model/core/lib/execution/contexts/objectField';
import {
  getLastOperation,
  getFieldPath,
  getOperationData,
} from '@apollo-model/core/lib/execution/utils';

export const AMGeoJSONUpdateFieldFactory: IAMInputFieldFactory = {
  isApplicable(field) {
    return true;
  },
  getFieldName(field) {
    return `${field.name}`;
  },
  getField(field, schemaInfo) {
    return <AMInputField>{
      name: this.getFieldName(field),
      type: schemaInfo.schema.getType(
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
    };
  },
};
