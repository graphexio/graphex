import { astFromValue } from '@apollo-model/ast-from-value';
import TypeWrap from '@apollo-model/type-wrap';
import {
  ArgumentNode,
  FieldNode,
  InlineFragmentNode,
  Kind,
  NamedTypeNode,
  ObjectFieldNode,
  OperationDefinitionNode,
  typeFromAST,
  TypeNode,
  VariableDefinitionNode,
  VariableNode,
  GraphQLNamedType,
  GraphQLType,
} from 'graphql';
import * as R from 'ramda';
import { visit } from './visitor';

import {
  capitalizeFirstLetter,
  mapTypeForTypeStack,
  getNameValue,
  getFragmentTypeName,
  getFields,
  mapFieldForTypeStack,
  getArgs,
  mapArgForTypeStack,
} from './utils';

export const transformRequest = (transformOptions, transformContext) => async (
  request,
  options: { context?: any } = {}
) => {
  let variableTypes = {};
  const { variables } = request;
  const typeStack = [];
  const typeStackPush = item => typeStack.push(item);
  const getType = typeName => {
    return transformContext.initialSchema.getType(typeName);
  };
  const initialSchema = transformContext.initialSchema;

  const visitor = {
    // enter(node) {
    //   console.log('enter', node);
    // },
    // leave(node) {
    //   console.log('leave', node);
    // },
    [Kind.OPERATION_DEFINITION]: {
      enter: (node: OperationDefinitionNode) => {
        R.pipe(
          capitalizeFirstLetter,
          getType,
          mapTypeForTypeStack,
          typeStackPush
        )(node.operation);
      },
      leave: (node: OperationDefinitionNode) => {
        typeStack.pop();
      },
    },
    [Kind.FIELD]: {
      enter: (node: FieldNode) => {
        let name = getNameValue(node);

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
        let name = getNameValue(node);
        if (name == '__typename') return;
        const type = typeStack.pop();
        // return
      },
    },
    [Kind.INLINE_FRAGMENT]: {
      enter: (node: InlineFragmentNode) => {
        let name = getFragmentTypeName(node);
        R.pipe(getType, mapTypeForTypeStack, typeStackPush)(name);
      },
      leave: (node: InlineFragmentNode) => {
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
      leave(node: VariableDefinitionNode) {},
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
    let newDocument = await visit(request.document, visitor);

    return {
      ...request,
      document: newDocument,
    };
  } catch (err) {
    console.log(err);
    throw err;
  }
};
