import {SchemaDirectiveVisitor} from 'graphql-tools';

import {appendTransform, reduceTransforms} from '../../inputTypes/utils';
import {fieldInputTransform} from '../../inputTypes/transforms';
import {TRANSFORM_TO_INPUT} from '../../inputTypes/handlers';
import {CREATE} from '../../inputTypes/kinds';

export const typeDef = `directive @default(value: String!) on FIELD_DEFINITION`;

class DefaultDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    let { value } = this.args;
    try {
      value = JSON.parse(value);
    } catch (e) {
      //skip parsing error
    }

    appendTransform(field, TRANSFORM_TO_INPUT, {
      [CREATE]: ({ field }) => [
        {
          name: field.name,
          type: field.type,
          mmTransformAlways: reduceTransforms([
            fieldInputTransform(field, CREATE),
            this._setDefaultValue(field.name, value),
          ]),
        },
      ],
    });
  }

  _setDefaultValue = (fieldName, defaultValue) => params => {
    let value = params[fieldName];
    if (value === undefined || value === null) {
      params[fieldName] = defaultValue;
    }

    return params;
  };
}

export const schemaDirectives = {
  default: DefaultDirective,
};
