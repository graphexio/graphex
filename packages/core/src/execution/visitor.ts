import {
  DocumentNode,
  getNamedType,
  getVisitFn,
  GraphQLScalarType,
  GraphQLSchema,
  isScalarType,
  Kind,
  TypeInfo,
  validate,
  ValueNode,
  VariableNode,
  visit,
} from 'graphql';
import R from 'ramda';
import {
  AMArgumet,
  AMEnumType,
  AMField,
  AMInputObjectType,
  AMModelField,
  AMModelType,
  AMObjectType,
  AMVisitorStack,
} from '../definitions';
import { astFromValue } from './astFromValue';
import { AMFieldsSelectionContext } from './contexts/fieldsSelection';
import { AMListValueContext } from './contexts/listValue';
import { AMObjectFieldContext } from './contexts/objectField';
import { AMOperation } from './operation';
import { AMTransaction } from './transaction';
import { AMFragmentContext } from './contexts/fragment';

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
      enter(node: ValueNode) {
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
      // enter(node) {
      //   console.log('enter', node, stack);
      // },
      // leave(node) {
      //   console.log('leave', node, stack);
      // },
      [Kind.ARGUMENT]: {
        enter(node) {
          // console.log(typeInfo.getArgument());
          const arg = typeInfo
            .getFieldDef()
            .args.find(arg => arg.name === node.name.value) as AMArgumet;
          if (arg.amEnter) {
            arg.amEnter(node, transaction, stack);
          }
        },
        leave(node) {
          const arg = typeInfo
            .getFieldDef()
            .args.find(arg => arg.name === node.name.value) as AMArgumet;
          if (arg.amLeave) {
            arg.amLeave(node, transaction, stack);
          }
        },
      },
      [Kind.INLINE_FRAGMENT]: {
        enter(node) {
          const lastInStack = R.last(stack) as AMFieldsSelectionContext;
          const context = new AMFragmentContext({
            fieldsSelectionContext: lastInStack,
          });
          stack.push(context);
        },
        leave(node) {
          const context = stack.pop();
        },
      },
      [Kind.SELECTION_SET]: {
        enter(node) {
          const selectionSetContext = new AMFieldsSelectionContext();
          stack.push(selectionSetContext);
        },
        leave(node) {
          const context = stack.pop() as AMFieldsSelectionContext;
          const stackLastItem = R.last(stack);
          if (stackLastItem) {
            if (stackLastItem instanceof AMOperation) {
              stackLastItem.setFieldsSelection(context);
            } else if (stackLastItem instanceof AMFieldsSelectionContext) {
              let lastField = stackLastItem.fields.pop();
              context.fields.forEach(field => {
                stackLastItem.fields.push(`${lastField}.${field}`);
              });
            } else if (stackLastItem instanceof AMFragmentContext) {
              context.fields.forEach(field => {
                stackLastItem.getFieldsSelectionContext().fields.push(field);
              });
            }
          }
        },
      },
      [Kind.FIELD]: {
        enter(node) {
          let fieldName = node.name.value;
          if (fieldName === '__typename') {
            return;
          }
          const type = getNamedType(typeInfo.getType()) as
            | AMModelType
            | AMObjectType;

          const field = type.getFields()[fieldName];

          if (field.amEnter) {
            field.amEnter(node, transaction, stack);
          }
        },
        leave(node) {
          let fieldName = node.name.value;
          if (fieldName === '__typename') {
            return;
          }
          const type = getNamedType(typeInfo.getType()) as
            | AMModelType
            | AMObjectType;
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
          if (isScalarType(type)) {
            scalarVisitor.enter(node);
            return null;
          }

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
          const context = new AMListValueContext();
          stack.push(context);
        },
        leave(node) {
          const context = stack.pop() as AMListValueContext;
          const lastInStack = R.last(stack);
          if (lastInStack instanceof AMObjectFieldContext) {
            lastInStack.setValue(context.values);
          } else if (lastInStack instanceof AMListValueContext) {
            lastInStack.addValue(context.values);
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
      [Kind.VARIABLE_DEFINITION]: {
        enter(node) {
          return null;
        },
        leave(node) {},
      },
      [Kind.VARIABLE]: {
        enter(node: VariableNode) {
          //replace variable with astnode to visit that fields
          const type = typeInfo.getInputType();
          const newNode = astFromValue(variableValues[node.name.value], type);
          if (isScalarType(getNamedType(type))) {
            scalarVisitor.enter(newNode as ValueNode);
            return null;
          } else {
            visitor[newNode.kind]?.enter(newNode); // TODO: test it! Kind.OBJECT?
            return newNode;
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
