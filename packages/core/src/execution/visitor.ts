import { astFromValue } from '@apollo-model/ast-from-value';
import {
  ASTKindToNode,
  ASTNode,
  DocumentNode,
  getNamedType,
  getVisitFn,
  GraphQLScalarType,
  GraphQLSchema,
  isInterfaceType,
  isObjectType,
  isScalarType,
  Kind,
  TypeInfo,
  ValueNode,
  visit,
  Visitor,
  FragmentDefinitionNode,
} from 'graphql';
import {
  AMArgumet,
  AMEnumType,
  AMInputObjectType,
  AMModelField,
  AMModelType,
  AMObjectType,
} from '../definitions';
import { AMFieldsSelectionContext } from './contexts/fieldsSelection';
import { AMFragmentContext } from './contexts/fragment';
import { AMListValueContext } from './contexts/listValue';
import { AMObjectFieldContext } from './contexts/objectField';
import { AMOperation } from './operation';
import { AMTransaction } from './transaction';
import { AMVisitorStack } from './visitorStack';

export class AMVisitor {
  static visit(
    schema: GraphQLSchema,
    document: DocumentNode,
    variableValues: { [key: string]: any } = {},
    transaction: AMTransaction,
    fragments?: {
      [key: string]: FragmentDefinitionNode;
    }
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
    const stack = new AMVisitorStack();

    /**
     * Fill fragment definitions map with passed object, if any
     */
    const fragmentDefinitions = new Map<string, FragmentDefinitionNode>(
      fragments ? Object.entries(fragments) : undefined
    );

    const scalarVisitor = {
      enter(node: ValueNode) {
        const type = getNamedType(typeInfo.getInputType()) as GraphQLScalarType;

        const lastInStack = stack.last();
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
      [Kind.DOCUMENT]: {
        enter(node) {
          for (const definition of node.definitions) {
            if (definition.kind === Kind.FRAGMENT_DEFINITION) {
              fragmentDefinitions.set(definition.name.value, definition);
            }
          }
        },
      },
      [Kind.ARGUMENT]: {
        enter(node) {
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
      [Kind.FRAGMENT_DEFINITION]: {
        enter() {
          return false;
        },
      },
      [Kind.FRAGMENT_SPREAD]: {
        enter(node) {
          const definition = fragmentDefinitions.get(node.name.value);
          visit(definition.selectionSet, visitWithTypeInfo(typeInfo, visitor));
        },
      },
      [Kind.INLINE_FRAGMENT]: {
        enter(node) {
          const lastInStack = stack.last() as AMFieldsSelectionContext;
          const currentType = getNamedType(typeInfo.getType()) as AMModelType;
          const conditionType = schema.getType(
            node.typeCondition.name.value
          ) as AMModelType;

          let actualConditionType: AMModelType = null;
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
        enter() {
          const selectionSetContext = new AMFieldsSelectionContext();
          stack.push(selectionSetContext);
        },
        leave() {
          const context = stack.pop() as AMFieldsSelectionContext;
          const stackLastItem = stack.last();
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
          if (node.alias) {
            /**
             * Add $ prefix to prevent collision with real fields
             */
            stack.enterPath(`$${node.alias.value}`);
          } else {
            stack.enterPath(node.name.value);
          }

          if (field.amEnter) {
            field.amEnter(node, transaction, stack);
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

          stack.leavePath();

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
        enter() {
          const context = new AMListValueContext();
          stack.push(context);
        },
        leave() {
          const context = stack.pop() as AMListValueContext;
          const lastInStack = stack.last();
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
            const lastInStack = stack.last();
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
        enter() {
          return null;
        },
      },
      [Kind.VARIABLE]: {
        enter(node) {
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
    } as Visitor<ASTKindToNode, ASTNode>;
    visit(document, visitWithTypeInfo(typeInfo, visitor));
  }
}

function visitWithTypeInfo(typeInfo: TypeInfo, visitor): any {
  return {
    enter(node, ...rest) {
      if (visitor.enter) visitor.enter(node, ...rest);
      const fn = getVisitFn(visitor, node.kind, /* isLeaving */ false);
      if (fn) {
        const result = fn(node, ...rest);
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
    leave(node, ...rest) {
      typeInfo.leave(node);
      if (visitor.leave) visitor.leave(node, ...rest);
      const fn = getVisitFn(visitor, node.kind, /* isLeaving */ true);
      let result: ASTNode;
      if (fn) {
        result = fn(node, ...rest);
      }
      return result;
    },
  } as Visitor<ASTKindToNode, ASTNode>;
}

function isNode(maybeNode): boolean {
  return maybeNode != null && typeof maybeNode.kind === 'string';
}
