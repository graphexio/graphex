import TypeWrap from '@graphex/type-wrap';
import { ASTNode, getNamedType, isCompositeType } from 'graphql';
import { AMModelField, AMModelType } from '../../../../definitions';
import { AMObjectFieldContext } from '../../../../execution/contexts/objectField';
import { AMSelectorContext } from '../../../../execution/contexts/selector';
import { AMTransaction } from '../../../../execution/transaction';
import { AMVisitorStack } from '../../../../execution/visitorStack';
import { isEmbeddedType, ObjectEntriesWithSymbols } from '../../../../utils';
import { AMQuerySelectorComplexFieldFactory } from '../fieldFactories/querySelectorComplex';

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
      if (isEmbeddedType(getNamedType(field.type))) {
        ObjectEntriesWithSymbols(context.value).forEach(([key, value]) => {
          lastInStack.addValue(`${String(context.fieldName)}.${key}`, value);
        });
      } else {
        lastInStack.addValue(context.fieldName, context.value);
      }
    }
  }
}
