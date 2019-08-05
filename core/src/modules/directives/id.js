import { SchemaDirectiveVisitor } from 'graphql-tools';

import { appendTransform } from '../../inputTypes/utils';
import * as HANDLER from '../../inputTypes/handlers';
import * as KIND from '../../inputTypes/kinds';

export const typeDef = `directive @id on FIELD_DEFINITION`;

class ID extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    appendTransform(field, HANDLER.TRANSFORM_TO_INPUT, {
      [KIND.CREATE]: field => [],
      [KIND.UPDATE]: field => [],
    });
  }
}

export const schemaDirectives = {
  id: ID,
};
