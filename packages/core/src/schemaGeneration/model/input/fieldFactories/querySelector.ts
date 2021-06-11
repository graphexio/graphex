import { ASTNode, GraphQLInputType } from 'graphql';
import { AMModelField } from '../../../../definitions';
import { AMObjectFieldContext } from '../../../../execution/contexts/objectField';
import { AMSelectorContext } from '../../../../execution/contexts/selector';
import { AMTransaction } from '../../../../execution/transaction';
import { AMVisitorStack } from '../../../../execution/visitorStack';
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
  ): void;
  applyValue(
    node: ASTNode,
    transaction: AMTransaction,
    stack: AMVisitorStack,
    context: AMObjectFieldContext
  ) {
    const lastInStack = stack.last();
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
