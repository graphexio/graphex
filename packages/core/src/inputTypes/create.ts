import R from 'ramda';
import { AMDataContext } from '../execution/contexts/data';
import { AMListValueContext } from '../execution/contexts/listValue';
import { AMOperation } from '../execution/operation';
import {
  AMInputObjectType,
  AMModelField,
  IAMInputFieldFactory,
  IAMTypeFactory,
  AMModelType,
} from '../definitions';
import { AMCreateFieldFactory } from './fieldFactories/create';
import { AMCreateNestedFieldFactory } from './fieldFactories/createNested';
import { AMCreateRelationFieldFactory } from './fieldFactories/createRelation';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { getNamedType } from 'graphql';

const isApplicable = (field: AMModelField) => (
  fieldFactory: IAMInputFieldFactory
) => fieldFactory.isApplicable(field);

export const AMCreateTypeFactory: IAMTypeFactory<AMInputObjectType> = {
  getTypeName(modelType): string {
    return `${modelType.name}CreateInput`;
  },
  getType(modelType, schemaInfo) {
    const self: IAMTypeFactory<AMInputObjectType> = this;
    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {};

        Object.values(modelType.getFields()).forEach(field => {
          const fieldFactories = field?.mmFieldFactories?.AMCreateTypeFactory
            ? field.mmFieldFactories.AMCreateTypeFactory
            : [
                AMCreateFieldFactory,
                AMCreateNestedFieldFactory,
                AMCreateRelationFieldFactory,
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
  },
};
