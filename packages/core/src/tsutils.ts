import { AMModelField } from './types';
import { DirectiveNode, GraphQLDirective, valueFromAST } from 'graphql';

export function lowercaseFirstLetter(string: string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

export function getDirectiveAST(field: AMModelField, name: string) {
  if (field.astNode && field.astNode.directives) {
    return field.astNode.directives.find(
      directive => directive.name.value === name
    );
  }
  return undefined;
}

export function getArgValueFromDirectiveAST(
  directiveAST: DirectiveNode,
  directive: GraphQLDirective,
  argName: string
) {
  const argNode = directiveAST.arguments.find(
    argument => argument.name.value === argName
  );
  const arg = directive.args.find(arg => arg.name === argName);
  const defaultValue = arg.defaultValue;

  if (!argNode) {
    return defaultValue;
  }

  const value = valueFromAST(argNode.value, arg.type);
  if (value) {
    return value;
  } else {
    return defaultValue;
  }
}

export function toArray(value) {
  if (!Array.isArray(value)) {
    return [value];
  } else {
    return value;
  }
}
