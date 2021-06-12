import { AMInputFieldFactory, AMModelField } from '@graphex/core';
import { AMDataContext } from '@graphex/core';
import { AMObjectFieldContext } from '@graphex/core';
import { AMSelectorContext } from '@graphex/core';
import { AMInputField } from '@graphex/core/src/definitions';
import { UserInputError } from 'apollo-server';

export class AMGeoJSONIntersectsFieldFactory extends AMInputFieldFactory {
  isApplicable() {
    return true;
  }
  getFieldName(field: AMModelField) {
    return `${field.name}_intersects`;
  }
  getField(field) {
    return {
      name: this.getFieldName(field),
      type: this.schemaInfo.schema.getTypeMap().GeoJSONIntersectsInput,

      amEnter(node, transaction, stack) {
        const action = new AMObjectFieldContext(field.dbName);
        stack.push(action);
      },
      amLeave(node, transaction, stack) {
        const context = stack.pop() as AMObjectFieldContext;

        const lastInStack = stack.last();
        if (
          lastInStack instanceof AMDataContext ||
          lastInStack instanceof AMSelectorContext
        ) {
          if (Object.values(context.value).length !== 1) {
            throw new UserInputError('You should fill only one field');
          }

          lastInStack.addValue(context.fieldName, {
            $geoIntersects: {
              $geometry: Object.values(context.value)[0],
            },
          });
        }
      },
    } as AMInputField;
  }
}
