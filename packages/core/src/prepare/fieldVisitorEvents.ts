import {
  GraphQLSchema,
  isObjectType,
  getNamedType,
  isInputObjectType,
} from 'graphql';
import { getDirectiveAST } from '../tsutils';
import { AMModelField, AMModelType } from '../definitions';
import { AMObjectFieldContext } from '../execution/contexts/objectField';

export const fieldVisitorEvents = (
  schema: GraphQLSchema,
  fieldVisitorEventsMap: {}
) => {
  Object.values(schema.getTypeMap()).forEach((type: AMModelType) => {
    if (isObjectType(type) || isInputObjectType(type)) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        if (
          fieldVisitorEventsMap[type.name] &&
          fieldVisitorEventsMap[type.name][field.name]
        ) {
          let events = fieldVisitorEventsMap[type.name][field.name];

          field.amEnter = events.amEnter;
          field.amLeave = events.amLeave;
        }
      });
    }
  });
};
