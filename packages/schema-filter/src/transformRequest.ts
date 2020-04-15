import { astFromValue } from '@apollo-model/ast-from-value';
import {
  ArgumentNode,
  FieldNode,
  GraphQLType,
  InlineFragmentNode,
  Kind,
  ObjectFieldNode,
  OperationDefinitionNode,
  typeFromAST,
  VariableDefinitionNode,
  VariableNode,
  FragmentDefinitionNode,
  print,
  SelectionSetNode,
} from 'graphql';
import * as R from 'ramda';
import {
  capitalizeFirstLetter,
  getArgs,
  getFields,
  getFragmentTypeName,
  getNameValue,
  mapArgForTypeStack,
  mapFieldForTypeStack,
  mapTypeForTypeStack,
} from './utils';
import { visit } from './visitor';

export const transformRequest = (transformOptions, transformContext) => async (
  request,
  options: { context?: any } = {}
) => {
  const variableTypes = {};
  const { variables } = request;
  const typeStack = [];
  const typeStackPush = item => typeStack.push(item);
  const getType = typeName => {
    return transformContext.initialSchema.getType(typeName);
  };
  const initialSchema = transformContext.initialSchema;

  const fragmentDefinitions = new Map<string, FragmentDefinitionNode>();

  const visitor = {
    // enter(node) {
    //   console.log('enter', node);
    // },
    // leave(node) {
    //   console.log('leave', node);
    // },
    [Kind.DOCUMENT]: {
      enter(node) {
        const newDefinitions = [];
        for (const definition of node.definitions) {
          if (definition.kind === Kind.FRAGMENT_DEFINITION) {
            fragmentDefinitions.set(definition.name.value, definition);
          } else {
            newDefinitions.push(definition);
          }
        }
        return { ...node, definitions: newDefinitions };
      },
    },
    [Kind.FRAGMENT_DEFINITION]: {
      enter() {
        return false;
      },
    },
    [Kind.FRAGMENT_SPREAD]: {
      enter(node) {
        return false;
      },
    },
    [Kind.SELECTION_SET]: {
      enter(node: SelectionSetNode) {
        const newSelections = [];

        node.selections.forEach(selection => {
          if (selection.kind === Kind.FRAGMENT_SPREAD) {
            fragmentDefinitions
              .get(selection.name.value)
              ?.selectionSet.selections.forEach(selection => {
                newSelections.push(selection);
              });
          } else {
            newSelections.push(selection);
          }
        });

        return { ...node, selections: newSelections };
      },
    },
    [Kind.OPERATION_DEFINITION]: {
      enter: (node: OperationDefinitionNode) => {
        R.pipe(
          capitalizeFirstLetter,
          getType,
          mapTypeForTypeStack,
          typeStackPush
        )(node.operation);
      },
      leave: () => {
        typeStack.pop();
      },
    },
    [Kind.FIELD]: {
      enter: (node: FieldNode) => {
        const name = getNameValue(node);

        if (name == '__typename') return;

        R.pipe(
          R.last,
          getFields,
          R.prop(name),
          mapFieldForTypeStack,
          typeStackPush
        )(typeStack);

        return transformContext.defaults.applyDefaultArgs(
          node,
          variables,
          options.context
        )(R.head(R.takeLast(2, typeStack)), R.last(typeStack));
      },
      leave: (node: FieldNode) => {
        const name = getNameValue(node);
        if (name == '__typename') return;
        typeStack.pop();
        return;
      },
    },
    [Kind.INLINE_FRAGMENT]: {
      enter: (node: InlineFragmentNode) => {
        const name = getFragmentTypeName(node);
        R.pipe(getType, mapTypeForTypeStack, typeStackPush)(name);
      },
      leave: () => {
        typeStack.pop();
      },
    },
    [Kind.ARGUMENT]: {
      enter: (node: ArgumentNode) => {
        if (
          node.value.kind === Kind.VARIABLE &&
          !variables[node.value.name.value]
        ) {
          return null;
        }

        R.pipe(
          R.last,
          getArgs,
          R.prop(getNameValue(node)),
          mapArgForTypeStack,
          typeStackPush
        )(typeStack);
      },
      leave: (node: ArgumentNode) => {
        return transformContext.defaults.applyDefaults(
          node,
          variables,
          options.context
        )(typeStack.pop());
      },
    },
    [Kind.OBJECT_FIELD]: {
      enter: (node: ObjectFieldNode) => {
        if (
          node.value.kind === Kind.VARIABLE &&
          !variables[node.value.name.value]
        ) {
          return null;
        }

        R.pipe(
          R.last,
          getFields,
          R.prop(getNameValue(node)),
          mapArgForTypeStack,
          typeStackPush
        )(typeStack);
      },
      leave: (node: ObjectFieldNode) => {
        return transformContext.defaults.applyDefaults(
          node,
          variables,
          options.context
        )(typeStack.pop());
      },
    },
    [Kind.VARIABLE_DEFINITION]: {
      enter(node: VariableDefinitionNode) {
        let type: GraphQLType;

        if (node.type.kind === 'ListType') {
          type = typeFromAST(initialSchema, node.type);
        } else if (node.type.kind === 'NonNullType') {
          type = typeFromAST(initialSchema, node.type);
        } else if (node.type.kind === 'NamedType') {
          type = typeFromAST(initialSchema, node.type);
        }

        variableTypes[node.variable.name.value] = type;

        return null;
      },
      leave() {
        return;
      },
    },
    [Kind.VARIABLE]: {
      enter(node: VariableNode) {
        const type = variableTypes[node.name.value];
        const newNode = astFromValue(
          variables[node.name.value] ? variables[node.name.value] : null,
          type
        );
        if (!newNode) return null;

        if (newNode && newNode.kind && visitor[newNode.kind]) {
          visitor[newNode.kind].enter(newNode);
        } // TODO: test it! Kind.OBJECT?

        return newNode;
      },
    },
  };

  try {
    const newDocument = await visit(request.document, visitor);

    return {
      ...request,
      document: newDocument,
    };
  } catch (err) {
    throw err;
  }
};
