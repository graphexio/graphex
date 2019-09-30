import {
  visit,
  Kind,
  TypeInfo,
  parse,
  DocumentNode,
  GraphQLSchema,
  getNamedType,
  ASTKindToNode,
  getVisitFn,
  GraphQLCompositeType,
  GraphQLInterfaceType,
  GraphQLObjectType,
} from 'graphql';
import { AMTransaction } from './transaction';
import { Visitor } from '@babel/core';
import {
  AMModelType,
  AMInputObjectType,
  AMVisitorStack,
  AMObjectType,
  AMInterfaceType,
} from '../types';
import { AMSelectionSetAction } from './actions/selectionSet';
import R from 'ramda';
import { AMOperation } from './operations/operation';

export class AMVisitor {
  static visit(
    schema: GraphQLSchema,
    document: DocumentNode,
    transaction: AMTransaction
  ) {
    const typeInfo = new TypeInfo(schema);
    const stack: AMVisitorStack = [];

    // typeInfo.enter({
    //   kind: 'OperationDefinition',
    //   operation: 'query',
    //   variableDefinitions: [],
    //   selectionSet: { kind: 'SelectionSet', selections: [] },
    //   name: undefined,
    // });
    // typeInfo.enter({
    //   kind: 'SelectionSet',
    //   selections: [],
    // });

    var visitor = {
      enter(node) {
        console.log('----');
        console.log(node.kind, typeInfo.getType(), typeInfo.getInputType());

        console.log('----');
      },
      leave(node) {},
      // [Kind.ARGUMENT]: {
      //   enter(node) {
      //     // console.log(typeInfo.getArgument());
      //     console.log('arg');
      //   },
      //   leave(node) {},
      // },
      // [Kind.OBJECT]: {
      //   enter(node) {
      //     console.log('obj');
      //   },
      // },
      [Kind.SELECTION_SET]: {
        enter(node) {
          const selectionSetAction = new AMSelectionSetAction();
          stack.push(selectionSetAction);
        },
        leave(node) {
          const action = stack.pop();
          const stackLastItem = R.last(stack);
          if (stackLastItem && stackLastItem instanceof AMOperation) {
            stackLastItem.addAction(action);
          }
        },
      },
      [Kind.FIELD]: {
        enter(node) {
          console.log('enter-field');
          const type = getNamedType(typeInfo.getType()) as
            | AMObjectType
            | AMInterfaceType
            | AMInputObjectType;
          const fieldName = node.name.value;
          const field = type.getFields()[fieldName];
          if (field.amEnter) {
            console.log('enter');
            field.amEnter(node, transaction, stack);
          }
        },
        leave(node) {
          console.log('leave-field');

          const type = getNamedType(typeInfo.getType()) as
            | AMObjectType
            | AMInterfaceType
            | AMInputObjectType;
          const fieldName = node.name.value;
          const field = type.getFields()[fieldName];
          console.log('leave-field');
          if (field.amLeave) {
            console.log('leave');
            field.amLeave(node, transaction, stack);
          }
        },
      },
    };
    visit(document, visitWithTypeInfo(typeInfo, visitor));
  }
}

function visitWithTypeInfo(typeInfo: any, visitor: any): any {
  return {
    enter(node) {
      const fn = getVisitFn(visitor, node.kind, /* isLeaving */ false);
      if (fn) {
        const result = fn.apply(visitor, arguments);
        typeInfo.enter(node);
        if (result !== undefined) {
          typeInfo.leave(node);
          if (isNode(result)) {
            typeInfo.enter(result);
          }
        }
        return result;
      } else {
        typeInfo.enter(node);
      }
    },
    leave(node) {
      typeInfo.leave(node);
      const fn = getVisitFn(visitor, node.kind, /* isLeaving */ true);
      let result;
      if (fn) {
        result = fn.apply(visitor, arguments);
      }
      return result;
    },
  };
}

function isNode(maybeNode): boolean {
  return maybeNode != null && typeof maybeNode.kind === 'string';
}
