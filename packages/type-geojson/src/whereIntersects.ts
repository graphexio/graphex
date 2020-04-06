import { AMInputFieldFactory, AMModelField } from '@apollo-model/core';
import { AMDataContext } from '@apollo-model/core/lib/execution/contexts/data';
import { AMObjectFieldContext } from '@apollo-model/core/lib/execution/contexts/objectField';
import { AMSelectorContext } from '@apollo-model/core/lib/execution/contexts/selector';
import { AMInputField } from '@apollo-model/core/src/definitions';
import { UserInputError } from 'apollo-server';
import { ObjectFieldNode } from 'graphql';
import R from 'ramda';

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
