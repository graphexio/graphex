import { defaultFieldResolver } from 'graphql';
import { SchemaDirectiveVisitor } from 'graphql-tools';

import InputTypes, {
  TRANSFORM_TO_INPUT,
  TRANSFORM_INPUT,
  INPUT_WHERE,
  INPUT_WHERE_UNIQUE,
  INPUT_CREATE,
  INPUT_ORDER_BY,
  appendTransform,
} from '../inputTypes';

import { getLastType } from '../utils';

export const UniqueScheme = `directive @unique on FIELD_DEFINITION`;

export default class Unique extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { _typeMap: SchemaTypes } = this.schema;
    const { field: relationField } = this.args;

    this.mmInputTypes = new InputTypes({ SchemaTypes });

    appendTransform(field, TRANSFORM_TO_INPUT, {
      [INPUT_WHERE_UNIQUE]: field => [
        this.mmInputTypes.wrapTransformInputWhere(
          {
            name: field.name,
            type: getLastType(field.type),
          },
          { modifier: '', [TRANSFORM_INPUT]: field[TRANSFORM_INPUT] }
        ),
      ],
    });
  }
}
