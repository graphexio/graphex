import { AMModelType } from '../definitions';
import { AMSelectorContext } from '../execution';
import { AMOperation } from '../execution/operation';
import { isDiscriminatorRequiredForType } from '../utils';

export const attachDiscriminatorToOperationHandler = (
  modelType: AMModelType
) => ({
  amLeave(node, transaction, stack) {
    const context = stack.pop() as AMOperation;
    if (isDiscriminatorRequiredForType(modelType)) {
      if (!context.selector) {
        context.setSelector(new AMSelectorContext());
      }

      context.selector.addValue(
        modelType.mmDiscriminatorField,
        modelType.mmDiscriminator
      );
    }
  },
});
