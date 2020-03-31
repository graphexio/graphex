import { ASTNode, GraphQLInputType } from 'graphql';
import R from 'ramda';
import { AMModelField, AMVisitorStack } from '../../definitions';
import { AMObjectFieldContext } from '../../execution/contexts/objectField';
import { AMSelectorContext } from '../../execution/contexts/selector';
import { AMTransaction } from '../../execution/transaction';
import { AMQuerySelectorComplexFieldFactory } from './querySelectorComplex';

export abstract class AMQuerySelectorFieldFactory extends AMQuerySelectorComplexFieldFactory {
  abstract getFieldType(field: AMModelField): GraphQLInputType;
  abstract transformValue(value: any): any;
  applyValue(
    node: ASTNode,
    transaction: AMTransaction,
    stack: AMVisitorStack,
    context: AMObjectFieldContext,
    field: AMModelField
  ) {
    const lastInStack = R.last(stack);
    if (
      lastInStack instanceof AMSelectorContext ||
      lastInStack instanceof AMObjectFieldContext
    ) {
      lastInStack.addValue(
        context.fieldName,
        this.transformValue(context.value)
      );
    }
  }
}
