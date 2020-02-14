import {
  getNamedType,
  GraphQLInputType,
  ObjectFieldNode,
  ASTNode,
} from 'graphql';
import R from 'ramda';
import {
  AMInputField,
  AMInputFieldFactory,
  AMModelField,
  AMVisitorStack,
} from '../../definitions';
import { AMObjectFieldContext } from '../../execution/contexts/objectField';
import { AMSelectorContext } from '../../execution/contexts/selector';
import { AMQuerySelectorComplexFieldFactory } from './querySelectorComplexClass';
import { AMTransaction } from '../../execution/transaction';

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
