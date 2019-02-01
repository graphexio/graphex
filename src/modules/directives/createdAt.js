import { appendTransform, reduceTransforms } from '../../inputTypes/utils';
import { TRANSFORM_TO_INPUT } from '../../inputTypes/handlers';
import { CREATE } from '../../inputTypes/kinds';
import { fieldInputTransform } from '../../inputTypes/transforms';
import { TimestampDirective } from './timestamps';

export const typeDef = `directive @createdAt on FIELD_DEFINITION`;

class CreatedAt extends TimestampDirective {
  visitFieldDefinition(field) {
    appendTransform(field, TRANSFORM_TO_INPUT, {
      [CREATE]: ({ field }) => [
        {
          name: field.name,
          type: field.type,
          mmTransformAlways: reduceTransforms([
            fieldInputTransform(field, CREATE),
            this._setDate(field),
          ]),
        },
      ],
    });
  }
}

export const schemaDirectives = {
  createdAt: CreatedAt,
};

// export const CreatedAtResolver = TimestampResolver;
