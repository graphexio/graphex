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
            //Must do the transforms first then fieldInputTransform so that default doesn't break things
            //Also you are dealing in raw document structure in here
            this._setDateCreate(field.name),
            fieldInputTransform(field, CREATE),
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
