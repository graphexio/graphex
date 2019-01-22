import _ from 'lodash';

import {defaultFieldResolver} from 'graphql';
import {SchemaDirectiveVisitor} from 'graphql-tools';

import {appendTransform} from '~/inputTypes/utils';
import * as HANDLER from '~/inputTypes/handlers';
import * as KIND from '~/inputTypes/kinds';

export const DirectiveDBScheme = `directive @db(name:String!, defaultValue:String=null) on FIELD_DEFINITION`;

export default class DirectiveDB extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const {name} = this.args;
    appendTransform(field, HANDLER.TRANSFORM_INPUT, {
      [KIND.ORDER_BY]: this._renameTransform(field.name, name),
      [KIND.CREATE]: this._renameTransform(field.name, name),
      [KIND.WHERE]: this._renameTransform(field.name, name),
    });
  }
  
  _renameTransform = (fieldName, dbName) => params => {
    
    let value = params[fieldName];
    return {
      ..._.omit(params, fieldName),
      [dbName]: value,
    };
  };
}

export function DirectiveDBResolver(next, source, args, ctx, info) {
  const {name} = args;
  info.fieldName = name;
  return next();
}
