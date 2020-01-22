import { defaultObjectFieldVisitorHandler } from '@apollo-model/core/lib/inputTypes/visitorHandlers';
import {
  AMInputField,
  IAMInputFieldFactory,
} from '@apollo-model/core/src/definitions';
import { GraphQLNamedType } from 'graphql';

export const AMGeoJSONCreateFieldFactory: IAMInputFieldFactory = {
  isApplicable(field) {
    return true;
  },
  getFieldName(field) {
    return `${field.name}`;
  },
  getField(field, schemaInfo) {
    return <AMInputField>{
      name: this.getFieldName(field),
      type: schemaInfo.schema.getType(
        `${(field.type as GraphQLNamedType).name}Input`
      ),
      ...defaultObjectFieldVisitorHandler(field.dbName),
      //   amEnter(node: ObjectFieldNode, transaction, stack) {
      //     const action = new AMObjectFieldContext(field.dbName);
      //     stack.push(action);
      //   },
      //   amLeave(node, transaction, stack) {
      //     const context = stack.pop() as AMObjectFieldContext;
      //     console.log(context);

      //     const lastInStack = R.last(stack);
      //     if (
      //       lastInStack instanceof AMDataContext ||
      //       lastInStack instanceof AMSelectorContext
      //     ) {
      //       let value = context.value as {
      //         geometry: [number, number];
      //         minDistance?: number;
      //         maxDistance?: number;
      //       };
      //       console.log(value);
      //       lastInStack.addValue(context.fieldName, {
      //         $near: {
      //           $geometry: {
      //             type: 'Point',
      //             coordinates: value.geometry.coordinates,
      //           },
      //           ...(value.minDistance
      //             ? { $minDistance: value.minDistance }
      //             : null),
      //           ...(value.maxDistance
      //             ? { $maxDistance: value.maxDistance }
      //             : null),
      //         },
      //       });
      //     }
      //   },
    };
  },
};
