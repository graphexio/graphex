import { AMFieldsSelectionContext } from '../execution';

export const defaultSelectionVisitorHandler = fieldName => ({
  amEnter: (node, transaction, stack) => {
    const lastStackItem = stack.last();
    if (lastStackItem instanceof AMFieldsSelectionContext) {
      lastStackItem.addField(fieldName);
    }
  },
});
