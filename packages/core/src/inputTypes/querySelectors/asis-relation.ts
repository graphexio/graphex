import TypeWrap from '@apollo-model/type-wrap';
import { getNamedType, ObjectFieldNode, isInterfaceType } from 'graphql';
import R from 'ramda';
import { IAMQuerySelector } from '../../definitions';
import { AMObjectFieldContext } from '../../execution/contexts/objectField';
import { AMSelectorContext } from '../../execution/contexts/selector';
import { AMReadOperation } from '../../execution/operations/readOperation';
import { AMWhereTypeFactory } from '../where';
import { AMInterfaceWhereTypeFactory } from '../interfaceWhere';

export const AsIsRelationSelector: IAMQuerySelector = {
  isApplicable(field) {
    const typeWrap = new TypeWrap(field.type);
    return Boolean(field.relation);
  },
  getFieldFactory() {
    return {
      isApplicable: this.isApplicable,
      getFieldName(field) {
        return field.name;
      },
      getField(field, schemaInfo) {
        const namedType = getNamedType(field.type);
        return {
          name: this.getFieldName(field),
          type: schemaInfo.resolveFactoryType(
            namedType,
            isInterfaceType(namedType)
              ? AMInterfaceWhereTypeFactory
              : AMWhereTypeFactory
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
                    .distinct(field.relation.relationField),
                });
              }
            }
          },
        };
      },
    };
  },
};
