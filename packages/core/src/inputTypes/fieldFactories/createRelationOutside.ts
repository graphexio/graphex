import TypeWrap from '@graphex/type-wrap';
import {
  AMInputField,
  AMInputFieldFactory,
  AMModelField,
  AMModelType,
} from '../../definitions';

export class AMCreateRelationOutsideFieldFactory extends AMInputFieldFactory {
  isApplicable(field: AMModelField) {
    return Boolean(field.isRelationOutside);
  }
  getFieldName(field) {
    return field.name;
  }
  getField(field) {
    const typeWrap = new TypeWrap(field.type);
    const isMany = typeWrap.isMany();
    const isRequired = typeWrap.isRequired();
    const type = this.configResolver.resolveInputType(
      typeWrap.realType() as AMModelType,
      isMany
        ? this.links.many
        : isRequired
        ? this.links.oneRequired
        : this.links.one
    );

    return {
      name: this.getFieldName(field),
      type,
    } as AMInputField;
  }
}
