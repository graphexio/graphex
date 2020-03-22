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
} from 'graphql';
import * as R from 'ramda';
import { visit } from './visitor';

const capitalizeFirstLetter = string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const reduceArgs = (map, arg) => {
  map[arg.name] = arg;
  return map;
};

const getFields = stackItem => stackItem.type.getFields();
const getArgs = stackItem => stackItem.args;

const getNameValue = node => node.name.value;
const getFragmentTypeName = node => node.typeCondition.name.value;

const mapTypeForTypeStack = type => ({ type });

export const mapFieldForTypeStack = field => ({
  type: new TypeWrap(field.type).realType(),
  args: field.args.reduce(reduceArgs, {}),
});

const mapArgForTypeStack = arg => ({
  type: new TypeWrap(arg.type).realType(),
});

export const groupFields = (predicate, object) => {
  let result = {};
  for (let key in object) {
    let predicateValue = predicate(object[key]);
    if (!result[predicateValue]) result[predicateValue] = {};
    result[predicateValue][key] = object[key];
  }
  return result;
};

export const reduceValues = values => {
  return values.reduce((state, item) => {
    state[item.name] = R.omit(['deprecationReason', 'isDeprecated'], item);
    return state;
  }, {});
};

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
        const type = typeFromAST(initialSchema, node.type);
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
