import { getNamedType, isCompositeType, ObjectFieldNode } from 'graphql';
import { AMInputField, IAMInputFieldFactory } from '../../types';
import { defaultObjectFieldVisitorHandler } from '../../inputTypes/visitorHandlers';
import { AMObjectFieldContext } from '../../execution/contexts/objectField';
import R from 'ramda';
import { AMDataContext } from '../../execution/contexts/data';
import { AMSelectorContext } from '../../execution/contexts/selector';

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
      type: schemaInfo.schema.getTypeMap().GeoJSONPointInput,
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
