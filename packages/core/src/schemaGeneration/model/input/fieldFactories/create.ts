import { getNamedType, isCompositeType } from 'graphql';
import { AMInputFieldFactory } from '../../../../definitions';
import { defaultObjectFieldVisitorHandler } from '../inputTypes/visitorHandlers';

export class AMCreateFieldFactory extends AMInputFieldFactory {
  isApplicable(field) {
    return (
      !isCompositeType(getNamedType(field.type)) &&
      !field.isID &&
      !field.isReadOnly
    );
  }
  getFieldName(field) {
    return field.name;
  }
  getField(field) {
    return {
      name: this.getFieldName(field),
      extensions: undefined,
      type: field.defaultValue ? getNamedType(field.type) : field.type,
      ...defaultObjectFieldVisitorHandler(field.dbName),
    };
  }
}
