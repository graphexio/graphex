import {appendTransform} from '../inputTypes/utils';
import {TRANSFORM_INPUT} from '../inputTypes/handlers';
import {CREATE, CREATE_ALWAYS, UPDATE, UPDATE_ALWAYS} from '../inputTypes/kinds';
import {TimestampDirective, TimestampResolver} from "./timestamps";

export const UpdatedAtScheme = `directive @updatedAt on FIELD_DEFINITION`;

export default class UpdatedAt extends TimestampDirective {
    visitFieldDefinition(field) {
        field.mmTransformAlways = [CREATE_ALWAYS, UPDATE_ALWAYS];
        appendTransform(field, TRANSFORM_INPUT, {
            [CREATE_ALWAYS]: this._setDateCreate(field.name),
            [UPDATE_ALWAYS]: this._setDateUpdate(field.name)
        });
    }
}

export const UpdatedAtResolver = TimestampResolver;
