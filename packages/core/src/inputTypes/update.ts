import R from 'ramda';
import {
  AMInputObjectType,
  AMModelField,
  AMModelType,
  AMTypeFactory,
  IAMInputFieldFactory,
  IAMTypeFactory,
} from '../definitions';
import { AMDataContext } from '../execution/contexts/data';
import { AMListValueContext } from '../execution/contexts/listValue';
// import { AMUpdateRelationFieldFactory } from './fieldFactories/updateRelation';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { AMOperation } from '../execution/operation';
import {
  getFieldPath,
  getLastOperation,
  getOperationData,
} from '../execution/utils';
import { AMUpdateFieldFactory } from './fieldFactories/update';
import { AMUpdateNestedFieldFactory } from './fieldFactories/updateNested';
import { AMUpdateRelationFieldFactory } from './fieldFactories/updateRelation';
import { getNamedType } from 'graphql';

const isApplicable = (field: AMModelField) => (
  fieldFactory: IAMInputFieldFactory
) => fieldFactory.isApplicable(field);

export class AMUpdateTypeFactory extends AMTypeFactory<AMInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}UpdateInput`;
  }
  getType(modelType: AMModelType) {
    const self: IAMTypeFactory<AMInputObjectType> = this;
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {};

        Object.values(modelType.getFields()).forEach(field => {
          const fieldType = getNamedType(field.type) as AMModelType;
          let links = this.getDynamicLinksForType(fieldType.name)
            .fieldFactories;
          if (!Array.isArray(links)) links = [links];

          const fieldFactories = this.configResolver
            .resolveInputFieldFactories(fieldType, links)
            .filter(factory => factory.isApplicable(field));

          fieldFactories.forEach(fieldFactory => {
            const fieldName = fieldFactory.getFieldName(field);
            fields[fieldName] = fieldFactory.getField(field);
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
            const newPath = R.pipe(
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
  }
}
