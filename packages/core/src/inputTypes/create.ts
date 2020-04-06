import { getNamedType, isInterfaceType } from 'graphql';
import R from 'ramda';
import {
  AMInputObjectType,
  AMModelType,
  AMTypeFactory,
  IAMTypeFactory,
} from '../definitions';
import { AMDataContext } from '../execution/contexts/data';
import { AMListValueContext } from '../execution/contexts/listValue';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import { AMOperation } from '../execution/operation';

export class AMCreateTypeFactory extends AMTypeFactory<AMInputObjectType> {
  isApplicable(modelType: AMModelType) {
    return !isInterfaceType(modelType);
  }
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
