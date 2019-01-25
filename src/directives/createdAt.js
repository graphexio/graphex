import {appendTransform} from '../inputTypes/utils';
import {TRANSFORM_INPUT} from '../inputTypes/handlers';
import {CREATE} from '../inputTypes/kinds';
import {TimestampDirective, TimestampResolver} from "./timestamps";

export const CreatedAtScheme = `directive @createdAt(name:String) on FIELD_DEFINITION`;

export default class CreatedAt extends TimestampDirective {
  visitFieldDefinition(field) {
    const {name} = this.args;
    appendTransform(field, TRANSFORM_INPUT, {
      [CREATE]: this._setDate(field.name, name)
    });
  }
}

export const CreatedAtResolver = TimestampResolver;
