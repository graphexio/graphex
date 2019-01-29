import _ from 'lodash';
import {SchemaDirectiveVisitor} from 'graphql-tools';

import {appendTransform} from '../inputTypes/utils';
import {TRANSFORM_INPUT} from '../inputTypes/handlers';
import {CREATE_ALWAYS} from '../inputTypes/kinds';

export const DefaultDirectiveScheme = `directive @default(value: String!) on FIELD_DEFINITION`;

export default class DefaultDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field) {
        let {value} = this.args;
        value = JSON.parse(value);
        
        field.mmTransformAlways = [CREATE_ALWAYS];
        appendTransform(field, TRANSFORM_INPUT, {
            [CREATE_ALWAYS]: this._setDefaultValue(field.name, value)
        });
    }
    
    _setDefaultValue = (fieldName, defaultValue) => params => {
        
        let value = params[fieldName];
        if (value === undefined || value === null) {
            value = defaultValue;
        }
        params[fieldName] = value;
        
        return params;
    };
}
