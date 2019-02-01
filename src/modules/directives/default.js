import {SchemaDirectiveVisitor} from 'graphql-tools';
import * as _ from "lodash";
import {appendTransform, reduceTransforms} from '../../inputTypes/utils';
import {fieldInputTransform} from '../../inputTypes/transforms';
import {TRANSFORM_TO_INPUT} from '../../inputTypes/handlers';
import {CREATE} from '../../inputTypes/kinds';

export const typeDef = `directive @default(value: String!) on FIELD_DEFINITION`;

class DefaultDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    let {value} = this.args;
    try {
      value = JSON.parse(value);
    } catch (e) {
      //skip parsing error
    }
    
    appendTransform(field, TRANSFORM_TO_INPUT, {
      [CREATE]: ({field}) => [
        {
          name: field.name,
          type: field.type,
          mmTransformAlways: reduceTransforms([
            fieldInputTransform(field, CREATE),
            this._setDefaultValue(field, value),
          ]),
        },
      ],
    });
  }
  
  _setDefaultValue = (field, defaultValue) => params => {
    
    let value = _.get(params, field.mmDatabaseName || field.name);
    if (value === undefined || value === null) {
      value = defaultValue;
    }
    
    return {
      [field.mmDatabaseName || field.name]: value
    };
  };
}

export const schemaDirectives = {
  default: DefaultDirective,
};
