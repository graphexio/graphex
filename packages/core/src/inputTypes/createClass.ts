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
import { AMCreateFieldFactory } from './fieldFactories/create';
import { AMCreateNestedFieldFactory } from './fieldFactories/createNested';
import { AMCreateRelationFieldFactory } from './fieldFactories/createRelation';
import { AMObjectFieldContext } from '../execution/contexts/objectField';

const isApplicable = (field: AMModelField) => (
  fieldFactory: IAMInputFieldFactory
) => fieldFactory.isApplicable(field);

import { AMTypeFactory, AMModelType } from '../definitions';
import { getNamedType } from 'graphql';
export class AMCreateTypeFactory extends AMTypeFactory<AMInputObjectType> {
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}CreateInput`;
  }
  getType(modelType: AMModelType) {
    const self: IAMTypeFactory<AMInputObjectType> = this;
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {};

        Object.values(modelType.getFields()).forEach(field => {
          const fieldType = getNamedType(field.type) as AMModelType;
          let links = this.links.fieldFactories;
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

        if (modelType.mmDiscriminatorField) {
          context.addValue(
            modelType.mmDiscriminatorField,
            modelType.mmDiscriminator
          );
        }

        /* Begin filling createdAt, updatedAt, default */
        if (modelType.mmCreatedAtFields) {
          modelType.mmCreatedAtFields.forEach(createdAtField => {
            context.addValue(createdAtField.dbName, new Date());
          });
        }
        if (modelType.mmUpdatedAtFields) {
          modelType.mmUpdatedAtFields.forEach(updatedAtField => {
            context.addValue(updatedAtField.dbName, new Date());
          });
        }
        if (modelType.mmDefaultFields) {
          modelType.mmDefaultFields.forEach(defaultField => {
            context.addValue(defaultField.dbName, defaultField.defaultValue);
          });
        }
        /* End filling createdAt, updatedAt, default */
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
        } else if (lastInStack instanceof AMDataContext) {
          lastInStack.setData(context.data);
        }
      },
    });
  }
}
