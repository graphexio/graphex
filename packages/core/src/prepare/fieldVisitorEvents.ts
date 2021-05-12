import {
  GraphQLSchema,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
} from 'graphql';
import { AMModelField, AMModelType } from '../definitions';
import { AMFieldsSelectionContext } from '../execution';

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
        } else {
          /**
           * Add default visitor handler
           */
          field.amEnter = (node, transaction, stack) => {
            const lastStackItem = stack.last();
            if (lastStackItem instanceof AMFieldsSelectionContext) {
              lastStackItem.addField(field.dbName);
            }
          };
        }
      });
    }
  });
};
