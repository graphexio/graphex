import { AMInputFieldFactory } from '@apollo-model/core';
import { AMDataContext } from '@apollo-model/core/lib/execution/contexts/data';
import { AMObjectFieldContext } from '@apollo-model/core/lib/execution/contexts/objectField';
import { AMSelectorContext } from '@apollo-model/core/lib/execution/contexts/selector';
import { AMInputField } from '@apollo-model/core/src/definitions';
import { ObjectFieldNode } from 'graphql';
import R from 'ramda';

export class AMGeoJSONNearFieldFactory extends AMInputFieldFactory {
  isApplicable(field) {
    return true;
  }
  getFieldName(field) {
    return `${field.name}_near`;
  }
  getField(field) {
    return <AMInputField>{
      name: this.getFieldName(field),
      type: this.schemaInfo.schema.getTypeMap().GeoJSONPointNearInput,
      //   ...defaultObjectFieldVisitorHandler(field.dbName),
      amEnter(node: ObjectFieldNode, transaction, stack) {
        const action = new AMObjectFieldContext(field.dbName);
        stack.push(action);
      },
      amLeave(node, transaction, stack) {
        const context = stack.pop() as AMObjectFieldContext;

        const lastInStack = R.last(stack);
        if (
          lastInStack instanceof AMDataContext ||
          lastInStack instanceof AMSelectorContext
        ) {
          let value = context.value as {
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
    };
  }
}
