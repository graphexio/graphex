import TypeWrap from '@graphex/type-wrap';
import {
  AMInputField,
  AMInputFieldFactory,
  AMModelField,
  AMModelType,
} from '../../definitions';
import { defaultObjectFieldVisitorHandler } from '../../common/visitorHandlers';

export class AMCreateRelationFieldFactory extends AMInputFieldFactory {
  isApplicable(field: AMModelField) {
    return Boolean(field.relation) && !field.relation.external;
  }
  getFieldName(field) {
    return field.name;
  }
  getField(field: AMModelField) {
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
      dbName: field.relation.storeField,
      relation: field.relation,
      ...defaultObjectFieldVisitorHandler(field.relation.storeField, field),
    } as AMInputField;
  }
}
