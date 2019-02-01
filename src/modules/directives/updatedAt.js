import {appendTransform, reduceTransforms} from '../../inputTypes/utils';
import {TRANSFORM_TO_INPUT} from '../../inputTypes/handlers';
import {CREATE, UPDATE} from '../../inputTypes/kinds';
import {fieldInputTransform} from '../../inputTypes/transforms';
import {TimestampDirective} from './timestamps';

export const typeDef = `directive @updatedAt on FIELD_DEFINITION`;

class UpdatedAt extends TimestampDirective {
  visitFieldDefinition(field) {
    appendTransform(field, TRANSFORM_TO_INPUT, {
      [CREATE]: ({field}) => [
        {
          name: field.name,
          type: field.type,
          mmTransformAlways: reduceTransforms([
            fieldInputTransform(field, CREATE),
            this._setDate(field),
          ]),
        },
      ],
      [UPDATE]: ({field}) => [
        {
          name: field.name,
          type: field.type,
          mmTransformAlways: reduceTransforms([
            fieldInputTransform(field, UPDATE),
            this._setDate(field),
          ]),
        },
      ],
    });
  }
}

export const schemaDirectives = {
  updatedAt: UpdatedAt,
};
