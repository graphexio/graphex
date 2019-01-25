import {appendTransform} from '../inputTypes/utils';
import {TRANSFORM_INPUT} from '../inputTypes/handlers';
import {CREATE, UPDATE} from '../inputTypes/kinds';
import {TimestampDirective, TimestampResolver} from "./timestamps";

export const UpdatedAtScheme = `directive @updatedAt(name:String!) on FIELD_DEFINITION`;

export default class UpdatedAt extends TimestampDirective {
  visitFieldDefinition(field) {
    const {name} = this.args;
    appendTransform(field, TRANSFORM_INPUT, {
      [CREATE]: this._setDate(field.name, name),
      [UPDATE]: this._setDate(field.name, name)
    });
  }
}

export const UpdatedAtResolver = TimestampResolver;
