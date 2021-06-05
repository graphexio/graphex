import TypeWrap from '@graphex/type-wrap';
import {
  AMInputField,
  AMInputFieldFactory,
  AMModelField,
  AMModelType,
} from '../../definitions';
import { isSubdocumentField } from '../../utils';
import { defaultObjectFieldVisitorHandler } from '../visitorHandlers';

export class AMCreateNestedFieldFactory extends AMInputFieldFactory {
  isApplicable(field: AMModelField) {
    return isSubdocumentField(field);
  }
  getFieldName(field: AMModelField) {
    return field.name;
  }
  getField(field: AMModelField) {
    const typeWrap = new TypeWrap(field.type);
    const type = this.configResolver.resolveInputType(
      typeWrap.realType() as AMModelType,
      typeWrap.isMany() ? this.links.many : this.links.one
    );

    return {
      name: this.getFieldName(field),
      type,
      ...defaultObjectFieldVisitorHandler(field.dbName),
    } as AMInputField;
  }
}
