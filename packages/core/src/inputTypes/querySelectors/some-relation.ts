import TypeWrap from '@apollo-model/type-wrap';
import { getNamedType } from 'graphql';
import R from 'ramda';
import { IAMQuerySelector } from '../../definitions';
import { AMObjectFieldContext } from '../../execution/contexts/objectField';
import { AMSelectorContext } from '../../execution/contexts/selector';
import { AMReadOperation } from '../../execution/operations/readOperation';
import { AMWhereTypeFactory } from '../where';

export const SomeRelationSelector: IAMQuerySelector = {
  isApplicable(field) {
    const typeWrap = new TypeWrap(field.type);
    return (
      typeWrap.isMany() &&
      Boolean(field.relation) &&
      !field.relation.abstract &&
      !field.relation.external
    );
  },
  getFieldFactory() {
    return {
      isApplicable: this.isApplicable,
      getFieldName(field) {
        return `${field.name}_some`;
      },
      getField(field, schemaInfo) {
        const namedType = getNamedType(field.type);
        return {
          name: this.getFieldName(field),
          type: schemaInfo.resolveFactoryType(namedType, AMWhereTypeFactory),
          extensions: undefined,
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
      },
    };
  },
};
