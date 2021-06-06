import TypeWrap from '@graphex/type-wrap';
import {
  DirectiveNode,
  GraphQLDirective,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLSchema,
  isInterfaceType,
  isObjectType,
  valueFromAST,
} from 'graphql';
import pluralize from 'pluralize';
import { isNil, reject } from 'ramda';
import {
  AMModelField,
  AMModelType,
  AMOptions,
  IAMFieldFactory,
} from './definitions';
import { makeSchemaInfo } from './schemaInfo';

export const compact = reject(isNil);

export function lowercaseFirstLetter(string: string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

export function uppercaseFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
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

export function getDirective(field, name) {
  if (field.astNode && field.astNode.directives) {
    return field.astNode.directives.find(
      directive => directive.name.value === name
    );
  }
  return undefined;
}

export function getDirectiveArg(directive, name, defaultValue) {
  const arg = directive.arguments.find(
    argument => argument.name.value === name
  );
  if (arg) return arg.value.value;
  else {
    return defaultValue;
  }
}

function camelize(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (letter, index) {
      return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
    })
    .replace(/\s+/g, '');
}

export function getRelationFieldName(collection, field, many = false) {
  field = field.replace('_', '');
  if (many) {
    field = pluralize(field);
  }
  return camelize(`${collection} ${field}`);
}

export function isAMModelType(type: GraphQLNamedType): type is AMModelType {
  const typeWrap = new TypeWrap(type);
  return (
    getDirective(type, 'model') || typeWrap.interfaceWithDirective('model')
  );
}

export const appendField = (
  schema: GraphQLSchema,
  targetType: GraphQLObjectType,
  fieldFactory: IAMFieldFactory,
  modelType: AMModelType,
  options: AMOptions
) => {
  const schemaInfo = makeSchemaInfo(schema, options);
  const fieldName = fieldFactory.getFieldName(modelType);
  targetType.getFields()[fieldName] = fieldFactory.getField(
    modelType,
    schemaInfo
  );
};

export const isModelType = (type: GraphQLNamedType) => {
  return Boolean(type['mmModel']);
};

export const isAbstractType = (type: GraphQLNamedType) => {
  return Boolean(type['mmAbstract']);
};

export const isConnectionType = (type: GraphQLNamedType) => {
  return Boolean(type['mmConnection']);
};

export const isEmbeddedType = (type: GraphQLNamedType) => {
  return (
    (isObjectType(type) || isInterfaceType(type)) &&
    !isModelType(type) &&
    !isAbstractType(type) &&
    !isConnectionType(type)
  );
};

export const isSubdocumentField = (field: AMModelField) => {
  return Boolean(field['isSubdocument']);
};

export const isDiscriminatorRequiredForType = (type: GraphQLNamedType) => {
  return (
    Boolean(type['mmDiscriminatorField']) &&
    Boolean(type['mmDiscriminator']) &&
    !isModelType(type)
  );
};
