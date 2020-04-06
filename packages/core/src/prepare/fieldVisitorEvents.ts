import {
  GraphQLSchema,
  isObjectType,
  getNamedType,
  isInputObjectType,
  isInterfaceType,
} from 'graphql';
import { getDirectiveAST } from '../utils';
import { AMModelField, AMModelType } from '../definitions';
import { AMObjectFieldContext } from '../execution/contexts/objectField';

export const fieldVisitorEvents = (
  schema: GraphQLSchema,
  fieldVisitorEventsMap: {}
) => {
  Object.values(schema.getTypeMap()).forEach((type: AMModelType) => {
    if (
      isObjectType(type) ||
      isInterfaceType(type) ||
      isInputObjectType(type)
    ) {
      Object.values(type.getFields()).forEach((field: AMModelField) => {
        if (
          fieldVisitorEventsMap[type.name] &&
          fieldVisitorEventsMap[type.name][field.name]
        ) {
          const events = fieldVisitorEventsMap[type.name][field.name];

          field.amEnter = events.amEnter;
          field.amLeave = events.amLeave;
        }
      });
    }
  });
};
