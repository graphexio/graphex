import gql from 'graphql-tag';
import { appendTransform, reduceTransforms } from '../../inputTypes/utils';
import { TRANSFORM_TO_INPUT } from '../../inputTypes/handlers';
import { CREATE, UPDATE } from '../../inputTypes/kinds';
import { fieldInputTransform } from '../../inputTypes/transforms';
import { TimestampDirective } from './timestamps';

export const typeDef = gql`
  directive @updatedAt on FIELD_DEFINITION
`;

class UpdatedAt extends TimestampDirective {
  visitFieldDefinition(field) {
    appendTransform(field, TRANSFORM_TO_INPUT, {
      [CREATE]: ({ field }) => [
        {
          name: field.name,
          type: field.type,
          mmTransformAlways: reduceTransforms([
            this._setDate(field.name),
            fieldInputTransform(field, CREATE),
          ]),
        },
      ],
      [UPDATE]: ({ field }) => [
        {
          name: field.name,
          type: field.type,
          mmTransformAlways: reduceTransforms([
            this._setDate(field.name),
            fieldInputTransform(field, UPDATE),
          ]),
        },
      ],
    });
  }
}

export const schemaDirectives = {
  updatedAt: UpdatedAt,
};
