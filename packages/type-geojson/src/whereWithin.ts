import { AMInputFieldFactory, AMModelField } from '@apollo-model/core';
import { AMDataContext } from '@apollo-model/core/lib/execution/contexts/data';
import { AMObjectFieldContext } from '@apollo-model/core/lib/execution/contexts/objectField';
import { AMSelectorContext } from '@apollo-model/core/lib/execution/contexts/selector';
import { AMInputField } from '@apollo-model/core/src/definitions';
import { ObjectFieldNode } from 'graphql';
import R from 'ramda';

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
