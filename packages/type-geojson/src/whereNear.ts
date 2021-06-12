import { AMInputFieldFactory, AMModelField } from '@graphex/core';
import { AMDataContext } from '@graphex/core';
import { AMObjectFieldContext } from '@graphex/core';
import { AMSelectorContext } from '@graphex/core';
import { AMInputField } from '@graphex/core';
import { ObjectFieldNode } from 'graphql';

export class AMGeoJSONNearFieldFactory extends AMInputFieldFactory {
  isApplicable() {
    return true;
  }
  getFieldName(field: AMModelField) {
    return `${field.name}_near`;
  }
  getField(field) {
    return {
      name: this.getFieldName(field),
      type: this.schemaInfo.schema.getTypeMap().GeoJSONPointNearInput,
      //   ...defaultObjectFieldVisitorHandler(field.dbName),
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
            geometry: [number, number];
            minDistance?: number;
            maxDistance?: number;
          };

          lastInStack.addValue(context.fieldName, {
            $near: {
              $geometry: value.geometry,
              ...(value.minDistance
                ? { $minDistance: value.minDistance }
                : null),
              ...(value.maxDistance
                ? { $maxDistance: value.maxDistance }
                : null),
            },
          });
        }
      },
    } as AMInputField;
  }
}
