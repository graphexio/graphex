import { ObjectFieldNode } from 'graphql';
import R from 'ramda';
import { defaultObjectFieldVisitorHandler } from '@apollo-model/core/lib/inputTypes/visitorHandlers';
import {
  AMInputField,
  IAMInputFieldFactory,
} from '@apollo-model/core/src/definitions';
import { AMObjectFieldContext } from '@apollo-model/core/lib/execution/contexts/objectField';
import { AMDataContext } from '@apollo-model/core/lib/execution/contexts/data';
import { AMSelectorContext } from '@apollo-model/core/lib/execution/contexts/selector';

export const AMGeoJSONNearFieldFactory: IAMInputFieldFactory = {
  isApplicable(field) {
    return true;
  },
  getFieldName(field) {
    return `${field.name}_near`;
  },
  getField(field, schemaInfo) {
    return <AMInputField>{
      name: this.getFieldName(field),
      type: schemaInfo.schema.getTypeMap().GeoJSONPointNearInput,
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
  },
};
