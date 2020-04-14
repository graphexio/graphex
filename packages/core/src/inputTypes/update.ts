import { getNamedType } from 'graphql';
import R from 'ramda';
import { AMInputObjectType, AMModelType, AMTypeFactory } from '../definitions';
import { AMDataContext } from '../execution/contexts/data';
import { AMListValueContext } from '../execution/contexts/listValue';
// import { AMUpdateRelationFieldFactory } from './fieldFactories/updateRelation';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { AMOperation } from '../execution/operation';
// import { AMUpdateRelationFieldFactory } from './fieldFactories/updateRelation';
// import { AMUpdateRelationFieldFactory } from './fieldFactories/updateRelation';
// import { AMUpdateRelationFieldFactory } from './fieldFactories/updateRelation';

export class AMUpdateTypeFactory extends AMTypeFactory<AMInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}UpdateInput`;
  }
  getType(modelType: AMModelType) {
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
          const operation = stack.lastOperation();
          const path = stack.getFieldPath(operation);

          const data = stack.getOperationData(operation);
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
        const lastInStack = stack.last();

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
