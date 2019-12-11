import gql from 'graphql-tag';
import { SchemaDirectiveVisitor } from 'graphql-tools';

import { appendTransform } from '../../inputTypes/utils';
import * as HANDLER from '../../inputTypes/handlers';
import { INPUT_TYPE_KIND } from '../../inputTypes/kinds';
import { AMModelField } from '../../definitions';

export const typeDef = gql`
  directive @id on FIELD_DEFINITION
`;

class ID extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: AMModelField) {
    field.isID = true;
    appendTransform(field, HANDLER.TRANSFORM_TO_INPUT, {
      [INPUT_TYPE_KIND.CREATE]: field => [],
      [INPUT_TYPE_KIND.UPDATE]: field => [],
    });
  }
}

export const schemaDirectives = {
  id: ID,
};
