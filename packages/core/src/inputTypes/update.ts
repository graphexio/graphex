import R from 'ramda';
import { AMDataContext } from '../execution/contexts/data';
import { AMListValueContext } from '../execution/contexts/listValue';
import { AMOperation } from '../execution/operation';
import {
  AMInputObjectType,
  AMModelField,
  IAMInputFieldFactory,
  IAMTypeFactory,
} from '../definitions';
import { AMUpdateFieldFactory } from './fieldFactories/update';
import { AMUpdateNestedFieldFactory } from './fieldFactories/updateNested';
// import { AMUpdateRelationFieldFactory } from './fieldFactories/updateRelation';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { AMUpdateRelationFieldFactory } from './fieldFactories/updateRelation';
import {
  getLastOperation,
  getFieldPath,
  getOperationData,
} from '../execution/utils';

const isApplicable = (field: AMModelField) => (
  fieldFactory: IAMInputFieldFactory
) => fieldFactory.isApplicable(field);

export const AMUpdateTypeFactory: IAMTypeFactory<AMInputObjectType> = {
  getTypeName(modelType): string {
    return `${modelType.name}UpdateInput`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMTypeFactory<AMInputObjectType> = this;
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {};

        Object.values(modelType.getFields()).forEach(field => {
          const fieldFactories = field?.mmFieldFactories?.AMUpdateTypeFactory
            ? field.mmFieldFactories.AMUpdateTypeFactory
            : [
                AMUpdateFieldFactory,
                AMUpdateNestedFieldFactory,
                AMUpdateRelationFieldFactory,
              ].filter(isApplicable(field));

          fieldFactories.forEach(fieldFactory => {
            const fieldName = fieldFactory.getFieldName(field);
            fields[fieldName] = fieldFactory.getField(field, schemaInfo);
          });
        });

        return fields;
      },
      amEnter(node, transaction, stack) {
        const context = new AMDataContext();
        stack.push(context);

        /* Begin filling updatedAt */
        if (modelType.mmUpdatedAtFields) {
          const operation = getLastOperation(stack);
          const path = getFieldPath(stack, operation);

          const data = getOperationData(stack, operation);
          const set = (data.data && data.data['$set']) || {};
          data.addValue('$set', set);

          modelType.mmUpdatedAtFields.forEach(updatedAtField => {
            let newPath = R.pipe(
              R.split('.'),
              R.reject(R.equals('')),
              R.append(updatedAtField.dbName),
              R.join('.')
            )(path);
            set[newPath] = new Date();
          });
        }
        /* End filling updatedAt */
      },
      amLeave(node, transaction, stack) {
        const context = stack.pop() as AMDataContext;
        const lastInStack = R.last(stack);

        if (lastInStack instanceof AMOperation) {
          lastInStack.setData(context);
        } else if (lastInStack instanceof AMListValueContext) {
          lastInStack.addValue(context.data);
        } else if (lastInStack instanceof AMObjectFieldContext) {
          lastInStack.setValue(context.data);
        }
      },
    });
  },
};
