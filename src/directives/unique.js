import {defaultFieldResolver} from 'graphql';
import {SchemaDirectiveVisitor} from 'graphql-tools';

import TypeWrap from '../typeWrap';
import {appendTransform, reduceTransforms} from '../inputTypes/utils';
import * as HANDLER from '../inputTypes/handlers';
import * as KIND from '../inputTypes/kinds';
import * as Transforms from '../inputTypes/transforms';

export const UniqueScheme = `directive @unique on FIELD_DEFINITION`;

export default class Unique extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const {_typeMap: SchemaTypes} = this.schema;
    const {field: relationField} = this.args;
    
    appendTransform(field, HANDLER.TRANSFORM_TO_INPUT, {
      [KIND.WHERE_UNIQUE]: ({field}) => [
        {
          name: field.name,
          type: new TypeWrap(field.type).realType(),
          mmDatabaseName: field.mmDatabaseName,
          mmTransform: reduceTransforms([
            Transforms.fieldInputTransform(field, KIND.WHERE),
            // Transforms.transformModifier(''),
          ]),
        },
      ],
    });
  }
}
