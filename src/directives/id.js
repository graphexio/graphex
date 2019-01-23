import { defaultFieldResolver } from 'graphql';
import { SchemaDirectiveVisitor } from 'graphql-tools';

import { appendTransform } from '~/inputTypes/utils';
import * as HANDLER from '~/inputTypes/handlers';
import * as KIND from '~/inputTypes/kinds';

import { getLastType } from '~/utils';

export const IDScheme = `directive @id on FIELD_DEFINITION`;

export default class ID extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    appendTransform(field, HANDLER.TRANSFORM_TO_INPUT, {
      [KIND.CREATE]: field => [],
      [KIND.UPDATE]: field => [],
    });
  }
}