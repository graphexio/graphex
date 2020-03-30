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
import { AMInputFieldFactory } from '@apollo-model/core';

export class AMGeoJSONWithinFieldFactory extends AMInputFieldFactory {
  isApplicable(field) {
    return true;
  }
  getFieldName(field) {
    return `${field.name}_within`;
  }
  getField(field) {
    return <AMInputField>{
      name: this.getFieldName(field),
      type: this.schemaInfo.schema.getTypeMap().GeoJSONPointWithinInput,

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
            geometry: number[][][];
          };

          lastInStack.addValue(context.fieldName, {
            $geoWithin: {
              $geometry: value.geometry,
            },
          });
        }
      },
    };
  }
}
