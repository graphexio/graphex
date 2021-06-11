import { ASTNode, GraphQLInputType } from 'graphql';
import {
  AMInputField,
  AMInputFieldFactory,
  AMModelField,
} from '../../../../definitions';
import { AMObjectFieldContext } from '../../../../execution/contexts/objectField';
import { AMTransaction } from '../../../../execution/transaction';
import { AMVisitorStack } from '../../../../execution/visitorStack';

export abstract class AMQuerySelectorComplexFieldFactory extends AMInputFieldFactory {
  abstract getFieldType(field: AMModelField): GraphQLInputType;
  abstract applyValue(
    node: ASTNode,
    transaction: AMTransaction,
    stack: AMVisitorStack,
    context: AMObjectFieldContext,
    field: AMModelField
  ): void;

  getField(field: AMModelField) {
    const type = this.getFieldType(field);

    return {
      name: this.getFieldName(field),
      type,
      amEnter: (node, transaction, stack) => {
        const context = new AMObjectFieldContext(field.dbName);
        stack.push(context);
      },
      amLeave: (node, transaction, stack) => {
        const context = stack.pop() as AMObjectFieldContext;
        this.applyValue(node, transaction, stack, context, field);
      },
    } as AMInputField;
  }
}
