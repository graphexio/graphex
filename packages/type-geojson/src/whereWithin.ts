import { AMInputFieldFactory, AMModelField } from '@graphex/core';
import {
  AMDataContext,
  AMObjectFieldContext,
  AMSelectorContext,
  AMInputField,
} from '@graphex/core';

import { ObjectFieldNode } from 'graphql';

export class AMGeoJSONWithinFieldFactory extends AMInputFieldFactory {
  isApplicable() {
    return true;
  }
  getFieldName(field: AMModelField) {
    return `${field.name}_within`;
  }
  getField(field: AMModelField) {
    return {
      name: this.getFieldName(field),
      type: this.schemaInfo.schema.getTypeMap().GeoJSONPointWithinInput,

      amEnter(node: ObjectFieldNode, transaction, stack) {
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
          const value = context.value as {
            geometry: number[][][];
          };

          lastInStack.addValue(context.fieldName, {
            $geoWithin: {
              $geometry: value.geometry,
            },
          });
        }
      },
    } as AMInputField;
  }
}
