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
  ASTNode,
  ValueNode,
  StringValueNode,
  BooleanValueNode,
  GraphQLScalarType,
  VariableNode,
  astFromValue,
  validate,
} from 'graphql';
import { AMTransaction } from './transaction';
import { Visitor } from '@babel/core';
import {
  AMModelType,
  AMInputObjectType,
  AMVisitorStack,
  AMObjectType,
  AMInterfaceType,
  AMModelField,
  AMField,
  AMEnumType,
} from '../types';
import { AMFieldsSelectionContext } from './contexts/fieldsSelection';
import R from 'ramda';
import { AMOperation } from './operation';
import { AMObjectFieldContext } from './contexts/objectField';
import { AMListValueContext } from './contexts/listValue';
import { AMDataContext } from './contexts/data';

function isAMModelField(
  object: AMField | AMModelField
): object is AMModelField {
  return 'dbName' in object;
}

export class AMVisitor {
  static visit(
    schema: GraphQLSchema,
    document: DocumentNode,
    variableValues: { [key: string]: any } = {},
    transaction: AMTransaction
  ) {
    const errors = validate(schema, document);
    if (errors.length > 0) {
      throw errors;
    }

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

    const scalarVisitor = {
      leave(node: ValueNode) {
        const type = getNamedType(typeInfo.getInputType()) as GraphQLScalarType;

        const lastInStack = R.last(stack);
        const value = type.parseLiteral(node, variableValues);
        if (lastInStack instanceof AMObjectFieldContext) {
          lastInStack.setValue(value);
        } else if (lastInStack instanceof AMListValueContext) {
          lastInStack.addValue(value);
        }
      },
    };

    var visitor = {
      enter(node) {
        // console.log('enter', node, stack);
      },
      leave(node) {
        // console.log('leave', node, stack);
      },
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
          const selectionSetAction = new AMFieldsSelectionContext();
          stack.push(selectionSetAction);
        },
        leave(node) {
          const action = stack.pop() as AMFieldsSelectionContext;
          const stackLastItem = R.last(stack);
          if (stackLastItem) {
            if (stackLastItem instanceof AMOperation) {
              stackLastItem.setFieldsSelection(action);
            } else if (stackLastItem instanceof AMFieldsSelectionContext) {
              let lastField = stackLastItem.fields.pop();
              action.fields.forEach(field => {
                stackLastItem.fields.push(`${lastField}.${field}`);
              });
            }
          }
        },
      },
      [Kind.FIELD]: {
        enter(node) {
          const type = getNamedType(typeInfo.getType()) as
            | AMModelType
            | AMObjectType;
          let fieldName = node.name.value;
          const field = type.getFields()[fieldName];

          if (field.amEnter) {
            field.amEnter(node, transaction, stack);
          }
        },
        leave(node) {
          const type = getNamedType(typeInfo.getType()) as
            | AMModelType
            | AMObjectType;
          const fieldName = node.name.value;
          const field = type.getFields()[fieldName];

          if (field.amLeave) {
            field.amLeave(node, transaction, stack);
          }
        },
      },
      [Kind.OBJECT]: {
        enter(node) {
          const type = getNamedType(
            typeInfo.getInputType()
          ) as AMInputObjectType;

          if (type.amEnter) {
            type.amEnter(node, transaction, stack);
          }
        },
        leave(node) {
          const type = getNamedType(
            typeInfo.getInputType()
          ) as AMInputObjectType;
          if (type.amLeave) {
            type.amLeave(node, transaction, stack);
          }
        },
      },
      [Kind.OBJECT_FIELD]: {
        enter(node) {
          const type = getNamedType(
            typeInfo.getInputType()
          ) as AMInputObjectType;
          const fieldName = node.name.value;
          const field = type.getFields()[fieldName];
          if (field.amEnter) {
            field.amEnter(node, transaction, stack);
          }
        },
        leave(node) {
          const type = getNamedType(
            typeInfo.getInputType()
          ) as AMInputObjectType;
          const fieldName = node.name.value;
          const field = type.getFields()[fieldName];

          if (field.amLeave) {
            field.amLeave(node, transaction, stack);
          }
        },
      },
      [Kind.LIST]: {
        enter(node) {
          const action = new AMListValueContext();
          stack.push(action);
        },
        leave(node) {
          const action = stack.pop() as AMListValueContext;
          const lastInStack = R.last(stack);

          if (lastInStack instanceof AMObjectFieldContext) {
            lastInStack.setValue(action.values);
          } else if (lastInStack instanceof AMListValueContext) {
            lastInStack.addValue(action.values);
          }
        },
      },
      [Kind.ENUM]: {
        enter(node) {
          const type = getNamedType(typeInfo.getInputType()) as AMEnumType;

          if (type.amEnter) {
            type.amEnter(node, transaction, stack);
          }
        },
        leave(node) {
          const type = getNamedType(typeInfo.getInputType()) as AMEnumType;
          if (type.amLeave) {
            type.amLeave(node, transaction, stack);
          } else {
            const lastInStack = R.last(stack);
            if (lastInStack instanceof AMObjectFieldContext) {
              lastInStack.setValue(node.value);
            }
          }
        },
      },
      [Kind.STRING]: scalarVisitor,
      [Kind.BOOLEAN]: scalarVisitor,
      [Kind.INT]: scalarVisitor,
      [Kind.FLOAT]: scalarVisitor,
      [Kind.VARIABLE]: {
        enter(node: VariableNode) {
          //replace variable with astnode to visit that fields
          const type = getNamedType(
            typeInfo.getInputType()
          ) as GraphQLScalarType;
          const newNode = astFromValue(variableValues[node.name.value], type);
          visitor[Kind.OBJECT].enter(newNode); // TODO: test it! Kind.OBJECT?
          return newNode;
        },
      },
    };
    visit(document, visitWithTypeInfo(typeInfo, visitor));
  }
}

function visitWithTypeInfo(typeInfo: any, visitor: any): any {
  return {
    enter(node) {
      if (visitor.enter) visitor.enter.apply(visitor, arguments);
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
      if (visitor.leave) visitor.leave.apply(visitor, arguments);
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
