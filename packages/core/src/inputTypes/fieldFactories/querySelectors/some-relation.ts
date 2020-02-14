import TypeWrap from '@apollo-model/type-wrap';
import { getNamedType } from 'graphql';
import * as R from 'ramda';
import {
  AMInputField,
  AMInputFieldFactory,
  AMModelField,
  AMModelType,
} from '../../../definitions';
import { AMObjectFieldContext } from '../../../execution/contexts/objectField';
import { AMSelectorContext } from '../../../execution/contexts/selector';
import { AMReadOperation } from '../../../execution/operations/readOperation';

export class SomeRelationSelector extends AMInputFieldFactory {
  isApplicable(field: AMModelField) {
    const typeWrap = new TypeWrap(field.type);
    return (
      typeWrap.isMany() &&
      Boolean(field.relation) &&
      !field.relation.abstract &&
      !field.relation.external
    );
  }
  getFieldName(field: AMModelField) {
    return `${field.name}_some`;
  }
  getField(field: AMModelField) {
    const namedType = getNamedType(field.type);
    return <AMInputField>{
      name: this.getFieldName(field),
      type: this.configResolver.resolveInputType(
        namedType as AMModelType,
        this.links.where
      ),
      amEnter(node, transaction, stack) {
        const context = new AMReadOperation(transaction, {
          collectionName: field.relation.collection,
          many: true,
        });
        stack.push(context);
      },
      amLeave(node, transaction, stack) {
        const context = stack.pop() as AMReadOperation;
        const lastInStack = R.last(stack);
        if (
          lastInStack instanceof AMSelectorContext ||
          lastInStack instanceof AMObjectFieldContext
        ) {
          lastInStack.addValue(field.relation.storeField, {
            $in: context.getOutput().distinct(field.relation.relationField),
          });
        }
      },
    };
  }
}
