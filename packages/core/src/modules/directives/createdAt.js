import gql from 'graphql-tag';
import { appendTransform, reduceTransforms } from '../../inputTypes/utils';
import { TRANSFORM_TO_INPUT } from '../../inputTypes/handlers';
import { INPUT_TYPE_KIND } from '../../inputTypes/kinds';
import { fieldInputTransform } from '../../inputTypes/transforms';
import { TimestampDirective } from './timestamps';

export const typeDef = gql`
  directive @createdAt on FIELD_DEFINITION
`;

class CreatedAt extends TimestampDirective {
  visitFieldDefinition(field) {
    appendTransform(field, TRANSFORM_TO_INPUT, {
      [INPUT_TYPE_KIND.CREATE]: ({ field }) => [
        {
          name: field.name,
          type: field.type,
          mmTransformAlways: reduceTransforms([
            this._setDate(field.name),
            fieldInputTransform(field, INPUT_TYPE_KIND.CREATE),
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
