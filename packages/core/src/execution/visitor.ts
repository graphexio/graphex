import { astFromValue } from '@apollo-model/ast-from-value';
import {
  DocumentNode,
  getNamedType,
  getVisitFn,
  GraphQLNamedType,
  GraphQLScalarType,
  GraphQLSchema,
  InlineFragmentNode,
  isScalarType,
  Kind,
  TypeInfo,
  ValueNode,
  VariableNode,
  visit,
  isInterfaceType,
  isObjectType,
  ASTNode,
  SelectionSetNode,
} from 'graphql';
import R, { o } from 'ramda';
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
import { AMFieldsSelectionContext } from './contexts/fieldsSelection';
import { AMFragmentContext } from './contexts/fragment';
import { AMListValueContext } from './contexts/listValue';
import { AMObjectFieldContext } from './contexts/objectField';
import { AMOperation } from './operation';
import { AMTransaction } from './transaction';

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
    /* 
    
    Code in resolve.ts splits request into separate documents which produces
    error if some variables become unused

    const errors = validate(schema, document);
    if (errors.length > 0) {
      throw errors;
    }

    */

    const typeInfo = new TypeInfo(schema);

    const pathInfo = (() => {
      const operationsMap = new Map<
        AMOperation,
        { path: string[]; db: string[] }
      >();
      return {
        push(pathItem: string, dbPathItem: string) {
          for (const { path, db } of operationsMap.values()) {
            path.push(pathItem);
            db.push(dbPathItem);
          }
        },
        pop() {
          for (const { path, db } of operationsMap.values()) {
            path.pop();
            db.pop();
          }
        },
        addOperation(operation: AMOperation) {
          operationsMap.set(operation, { path: [], db: [] });
        },
        removeOperation(operation: AMOperation) {
          operationsMap.delete(operation);
        },
        path(operation: AMOperation) {
          return operationsMap.get(operation).path;
        },
        db(operation: AMOperation) {
          return operationsMap.get(operation).db;
        },
      };
    })();

    const stack: AMVisitorStack = [];
    const oldStackPush = stack.push.bind(stack);
    const oldStackPop = stack.pop.bind(stack);
    stack.push = item => {
      if (item instanceof AMOperation) {
        pathInfo.addOperation(item);
      }
      return oldStackPush(item);
    };
    stack.pop = () => {
      const item = oldStackPop();
      if (item instanceof AMOperation) {
        pathInfo.removeOperation(item);
      }
      return item;
    };

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
        const value = node ? type.parseLiteral(node, variableValues) : null;
        if (lastInStack instanceof AMObjectFieldContext) {
          lastInStack.setValue(value);
        } else if (lastInStack instanceof AMListValueContext) {
          lastInStack.addValue(value);
        }
      },
    };

    const visitor = {
      // enter(node: ASTNode) {
      //   // console.log('enter', node, stack);
      // },
      // leave(node) {
      //   // console.log('leave', node, stack);
      // },
      [Kind.ARGUMENT]: {
        enter(node) {
          // console.log(typeInfo.getArgument());
          const arg = typeInfo
            .getFieldDef()
            .args.find(arg => arg.name === node.name.value) as AMArgumet;
          if (arg.amEnter) {
            arg.amEnter(node, transaction, stack, pathInfo);
          }
        },
        leave(node) {
          const arg = typeInfo
            .getFieldDef()
            .args.find(arg => arg.name === node.name.value) as AMArgumet;
          if (arg.amLeave) {
            arg.amLeave(node, transaction, stack, pathInfo);
          }
        },
      },
      [Kind.INLINE_FRAGMENT]: {
        enter(node: InlineFragmentNode) {
          const lastInStack = R.last(stack) as AMFieldsSelectionContext;
          const currentType = getNamedType(typeInfo.getType());
          const conditionType = schema.getType(node.typeCondition.name.value);

          let actualConditionType: GraphQLNamedType = null;
          /* 
          store actualConditionType only if currentType is interface 
          and condition type is implementation
          other cases are the same as no condition at all
          */
          if (
            conditionType !== currentType &&
            isInterfaceType(currentType) &&
            isObjectType(conditionType)
          ) {
            actualConditionType = conditionType;
          }

          const context = new AMFragmentContext({
            fieldsSelectionContext: lastInStack,
            conditionType,
            contextType: currentType,
            actualConditionType,
          });
          stack.push(context);
        },
        leave() {
          stack.pop();
        },
      },
      [Kind.SELECTION_SET]: {
        enter(node: SelectionSetNode) {
          const selectionSetContext = new AMFieldsSelectionContext();
          stack.push(selectionSetContext);

          //Process wildcard selections first to optimize operations
          const wildcardSelections = [];
          const otherSelections = [];
          node.selections.forEach(selection => {
            if (selection.kind === Kind.FIELD) {
              wildcardSelections.push(selection);
            } else {
              otherSelections.push(selection);
            }
          });
          return {
            ...node,
            selections: [...wildcardSelections, ...otherSelections],
          };
        },
        leave(node) {
          const context = stack.pop() as AMFieldsSelectionContext;
          const stackLastItem = R.last(stack);
          if (stackLastItem) {
            if (stackLastItem instanceof AMOperation) {
              const existingSelection = stackLastItem.fieldsSelection;
              if (existingSelection) {
                context.fields.forEach(field => {
                  existingSelection.addField(field);
                });
              } else {
                stackLastItem.setFieldsSelection(context);
              }
            } else if (stackLastItem instanceof AMFieldsSelectionContext) {
              const lastField = stackLastItem.fields.pop();
              context.fields.forEach(field => {
                stackLastItem.addField(`${lastField}.${field}`);
              });
            } else if (stackLastItem instanceof AMFragmentContext) {
              context.fields.forEach(field => {
                stackLastItem.getFieldsSelectionContext().addField(field);
              });
            }
          }
        },
      },
      [Kind.FIELD]: {
        enter(node) {
          const fieldName = node.name.value;
          if (fieldName === '__typename') {
            return;
          }
          const type = getNamedType(typeInfo.getType()) as
            | AMModelType
            | AMObjectType;

          const field = type.getFields()[fieldName] as AMModelField;
          pathInfo.push(node.name.value, field.dbName);

          if (field.amEnter) {
            field.amEnter(node, transaction, stack, pathInfo);
          }
        },
        leave(node) {
          const fieldName = node.name.value;
          if (fieldName === '__typename') {
            return;
          }
          const type = getNamedType(typeInfo.getType()) as
            | AMModelType
            | AMObjectType;
          const field = type.getFields()[fieldName];

          pathInfo.pop();

          if (field.amLeave) {
            field.amLeave(node, transaction, stack, pathInfo);
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
            type.amEnter(node, transaction, stack, pathInfo);
          }
        },
        leave(node) {
          const type = getNamedType(
            typeInfo.getInputType()
          ) as AMInputObjectType;
          if (type.amLeave) {
            type.amLeave(node, transaction, stack, pathInfo);
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
            field.amEnter(node, transaction, stack, pathInfo);
          }
        },
        leave(node) {
          const type = getNamedType(
            typeInfo.getInputType()
          ) as AMInputObjectType;
          const fieldName = node.name.value;

          const field = type.getFields()[fieldName];

          if (field.amLeave) {
            field.amLeave(node, transaction, stack, pathInfo);
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
            type.amEnter(node, transaction, stack, pathInfo);
          }
        },
        leave(node) {
          const type = getNamedType(typeInfo.getInputType()) as AMEnumType;
          if (type.amLeave) {
            type.amLeave(node, transaction, stack, pathInfo);
          } else {
            const lastInStack = R.last(stack);
            if (lastInStack instanceof AMObjectFieldContext) {
              lastInStack.setValue(node.value);
            } else if (lastInStack instanceof AMListValueContext) {
              lastInStack.addValue(node.value);
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
          if (!newNode) return null;

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
