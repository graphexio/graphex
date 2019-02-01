import _ from 'lodash';
import {SchemaDirectiveVisitor} from 'graphql-tools';

import {appendTransform} from '../inputTypes/utils';
import * as HANDLER from '../inputTypes/handlers';
import * as KIND from '../inputTypes/kinds';

export const DirectiveDBScheme = `directive @db(name:String!) on FIELD_DEFINITION`;

export default class DirectiveDB extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const {name} = this.args;
    field.mmDatabaseName = name;
    appendTransform(field, HANDLER.TRANSFORM_INPUT, {
      [KIND.CREATE]: params => params,
      [KIND.WHERE]: params => params,
    });
    
    appendTransform(field, HANDLER.TRANSFORM_TO_INPUT, {
      [KIND.ORDER_BY]: ({field}) => [
        {
          name: `${field.name}_ASC`,
          value: {[name]: 1},
        },
        {
          name: `${field.name}_DESC`,
          value: {[name]: -1},
        },
      ],
    });
  }
}

export function DirectiveDBResolver(next, source, args, ctx, info) {
  const {name} = args;
  if(Object.keys(source).includes(name)) {
    return source[name];
  }
  return next();
}
