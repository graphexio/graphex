import { getNamedType, ObjectFieldNode } from 'graphql';
import {
  AMInputField,
  AMInputFieldFactory,
  AMModelField,
  AMModelType,
} from '../../../definitions';
import { AMObjectFieldContext } from '../../../execution/contexts/objectField';
import { AMSelectorContext } from '../../../execution/contexts/selector';
import { AMReadOperation } from '../../../execution/operations/readOperation';
import { ResultPromiseTransforms } from '../../../execution/resultPromise';

export class AsIsRelationSelector extends AMInputFieldFactory {
  isApplicable(field: AMModelField) {
    return Boolean(field.relation);
  }
  getFieldName(field: AMModelField) {
    return field.name;
  }
  getField(field: AMModelField) {
    const namedType = getNamedType(field.type);
    return {
      name: this.getFieldName(field),
      type: this.configResolver.resolveInputType(
        namedType as AMModelType,
        this.links.where
      ),
      amEnter(node: ObjectFieldNode, transaction, stack) {
        if (node.value.kind === 'NullValue') {
          const lastInStack = stack.last();

          if (
            lastInStack instanceof AMSelectorContext ||
            lastInStack instanceof AMObjectFieldContext
          ) {
            lastInStack.addValue(field.relation.storeField, null);
          }
        } else {
          const context = new AMReadOperation(transaction, {
            collectionName: field.relation.collection,
            many: true,
          });
          stack.push(context);
        }
      },
      amLeave(node: ObjectFieldNode, transaction, stack) {
        if (node.value.kind !== 'NullValue') {
          const context = stack.pop() as AMReadOperation;
          const lastInStack = stack.last();
          if (
            lastInStack instanceof AMSelectorContext ||
            lastInStack instanceof AMObjectFieldContext
          ) {
            lastInStack.addValue(field.relation.storeField, {
              $in: context
                .getOutput()
                .map(
                  new ResultPromiseTransforms.Distinct(
                    field.relation.relationField
                  )
                ),
            });
          }
        }
      },
    } as AMInputField;
  }
}
