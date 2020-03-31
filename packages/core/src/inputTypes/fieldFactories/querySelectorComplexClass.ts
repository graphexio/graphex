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
import { AMTransaction } from '../../execution/transaction';

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
    const self = this;
    const namedType = getNamedType(field.type);
    let type = this.getFieldType(field);

    return <AMInputField>{
      name: this.getFieldName(field),
      type,
      amEnter(node: ObjectFieldNode, transaction, stack) {
        const context = new AMObjectFieldContext(field.dbName);
        stack.push(context);
      },
      amLeave(node, transaction, stack) {
        const context = stack.pop() as AMObjectFieldContext;
        self.applyValue(node, transaction, stack, context, field);
      },
    };
  }
}
