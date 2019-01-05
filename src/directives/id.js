import { defaultFieldResolver } from 'graphql';
import { SchemaDirectiveVisitor } from 'graphql-tools';

import InputTypes, {
  TRANSFORM_TO_INPUT,
  INPUT_WHERE,
  INPUT_WHERE_UNIQUE,
  INPUT_CREATE,
  INPUT_UPDATE,
  INPUT_ORDER_BY,
  appendTransform,
} from '../inputTypes';

import { getLastType } from '../utils';

export const IDScheme = `directive @id on FIELD_DEFINITION`;

export default class ID extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    appendTransform(field, TRANSFORM_TO_INPUT, {
      [INPUT_CREATE]: field => [],
      [INPUT_UPDATE]: field => [],
    });
  }
}
