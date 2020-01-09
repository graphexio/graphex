import TypeWrap from '@apollo-model/type-wrap';
import {
  getNamedType,
  GraphQLInputType,
  isCompositeType,
  ASTNode,
  ObjectFieldNode,
} from 'graphql';
import { IAMQuerySelector, AMVisitorStack } from '../../definitions';
import { AMWhereTypeFactory } from '../where';
import { AMQuerySelectorFieldFactory } from '../fieldFactories/querySelector';
import { AMQuerySelectorComplexFieldFactory } from '../fieldFactories/querySelectorComplex';
import { AMObjectFieldContext } from '../../execution/contexts/objectField';
import R from 'ramda';
import { AMSelectorContext } from '../../execution/contexts/selector';
import { AMTransaction } from '../../execution/transaction';
import { AMReadOperation } from '../../execution/operations/readOperation';

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
          type: schemaInfo.resolveFactoryType(namedType, AMWhereTypeFactory),
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
