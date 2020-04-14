import TypeWrap from '@apollo-model/type-wrap';
import {
  ASTNode,
  getNamedType,
  GraphQLInputType,
  isCompositeType,
  isInterfaceType,
} from 'graphql';
import * as R from 'ramda';
import {
  AMModelField,
  AMModelType,
  AMVisitorStack,
} from '../../../definitions';
import { AMObjectFieldContext } from '../../../execution/contexts/objectField';
import { AMSelectorContext } from '../../../execution/contexts/selector';
import { AMTransaction } from '../../../execution/transaction';
import { AMQuerySelectorComplexFieldFactory } from '../querySelectorComplex';

export class AsIsSelector extends AMQuerySelectorComplexFieldFactory {
  isApplicable(field: AMModelField) {
    const typeWrap = new TypeWrap(field.type);
    return !typeWrap.isMany() && !field.relation;
  }
  getFieldName(field: AMModelField) {
    return `${field.name}`;
  }
  getFieldType(field: AMModelField) {
    const namedType = getNamedType(field.type);
    if (!isCompositeType(namedType)) {
      return namedType;
    } else {
      return this.configResolver.resolveInputType(
        namedType as AMModelType,
        this.links.where
      );
    }
  }
  applyValue(
    node: ASTNode,
    transaction: AMTransaction,
    stack: AMVisitorStack,
    context: AMObjectFieldContext,
    field: AMModelField
  ) {
    const lastInStack = stack.last();
    if (
      lastInStack instanceof AMSelectorContext ||
      lastInStack instanceof AMObjectFieldContext
    ) {
      //transform nested objects to mongodb dot notation
      const namedType = getNamedType(field.type) as AMModelType;
      if (namedType.mmEmbedded) {
        Object.entries(context.value).forEach(([key, value]) => {
          lastInStack.addValue(`${context.fieldName}.${key}`, value);
        });
      } else {
        lastInStack.addValue(context.fieldName, context.value);
      }
    }
  }
}
