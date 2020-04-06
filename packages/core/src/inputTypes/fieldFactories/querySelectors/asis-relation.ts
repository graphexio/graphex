import TypeWrap from '@apollo-model/type-wrap';
import { getNamedType, ObjectFieldNode } from 'graphql';
import * as R from 'ramda';
import {
  AMInputField,
  AMInputFieldFactory,
  AMModelField,
  AMModelType,
} from '../../../definitions';
import { AMSelectorContext } from '../../../execution/contexts/selector';
import { AMObjectFieldContext } from '../../../execution/contexts/objectField';
import { AMReadOperation } from '../../../execution/operations/readOperation';
import { ResultPromiseTransforms } from '../../../execution/resultPromise';

export class AsIsRelationSelector extends AMInputFieldFactory {
  isApplicable(field: AMModelField) {
    const typeWrap = new TypeWrap(field.type);
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
          const lastInStack = R.last(stack);

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
          const lastInStack = R.last(stack);
          if (
            lastInStack instanceof AMSelectorContext ||
            lastInStack instanceof AMObjectFieldContext
          ) {
            lastInStack.addValue(field.relation.storeField, {
              $in: context
                .getOutput()
                .map(
                  ResultPromiseTransforms.distinct(field.relation.relationField)
                ),
            });
          }
        }
      },
    } as AMInputField;
  }
}
