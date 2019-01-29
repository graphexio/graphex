import {appendTransform} from '../inputTypes/utils';
import {TRANSFORM_INPUT} from '../inputTypes/handlers';
import {CREATE_ALWAYS} from '../inputTypes/kinds';
import {TimestampDirective, TimestampResolver} from "./timestamps";

export const CreatedAtScheme = `directive @createdAt on FIELD_DEFINITION`;

export default class CreatedAt extends TimestampDirective {
    visitFieldDefinition(field) {
        field.mmTransformAlways = [CREATE_ALWAYS];
        appendTransform(field, TRANSFORM_INPUT, {
            [CREATE_ALWAYS]: this._setDateCreate(field.name)
        });
    }
}

export const CreatedAtResolver = TimestampResolver;
