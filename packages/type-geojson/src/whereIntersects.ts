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
import { UserInputError } from 'apollo-server';

export const AMGeoJSONIntersectsFieldFactory: IAMInputFieldFactory = {
  isApplicable(field) {
    return true;
  },
  getFieldName(field) {
    return `${field.name}_intersects`;
  },
  getField(field, schemaInfo) {
    return <AMInputField>{
      name: this.getFieldName(field),
      type: schemaInfo.schema.getTypeMap().GeoJSONIntersectsInput,

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
    };
  },
};
