import _ from 'lodash';

import { defaultFieldResolver } from 'graphql';
import { SchemaDirectiveVisitor } from 'graphql-tools';

import InputTypes, {
  TRANSFORM_TO_INPUT,
  TRANSFORM_INPUT,
  INPUT_WHERE,
  INPUT_WHERE_UNIQUE,
  INPUT_CREATE,
  INPUT_ORDER_BY,
  INPUT_CREATE_CONNECT_ONE,
  appendTransform,
  applyInputTransform,
} from '../inputTypes';

export const DirectiveDBScheme = `directive @db(name:String!) on FIELD_DEFINITION`;

export default class DirectiveDB extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { name } = this.args;
    const { resolveMapFilterToSelector } = field;
    appendTransform(field, TRANSFORM_INPUT, {
      [INPUT_ORDER_BY]: this._renameTransform(field.name, name),
      [INPUT_CREATE]: this._renameTransform(field.name, name),
      [INPUT_WHERE]: this._renameTransform(field.name, name),
    });
  }

  _renameTransform = (fieldName, dbName) => params => {
    console.log(params);
    return {
      ..._.omit(params, fieldName),
      [dbName]: params[fieldName],
    };
  };
}

export function DirectiveDBResolver(next, source, args, ctx, info) {
  const { name } = args;
  info.fieldName = name;
  return next();
}
