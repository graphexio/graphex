import TypeWrap from '@apollo-model/type-wrap';
import {
  AMInputField,
  IAMInputFieldFactory,
  AMInputFieldFactory,
  AMModelType,
} from '../../definitions';
import { AMCreateManyRelationTypeFactory } from '../createManyRelation';
import { AMCreateOneRelationTypeFactory } from '../createOneRelation';
import { AMCreateOneRequiredRelationTypeFactory } from '../createOneRequiredRelation';
import { defaultObjectFieldVisitorHandler } from '../visitorHandlers';

export class AMCreateRelationFieldFactory extends AMInputFieldFactory {
  isApplicable(field) {
    return Boolean(field.relation);
  }
  getFieldName(field) {
    return field.name;
  }
  getField(field) {
    const typeWrap = new TypeWrap(field.type);
    const isMany = typeWrap.isMany();
    const isRequired = typeWrap.isRequired();
    let type = this.configResolver.resolveInputType(
      typeWrap.realType() as AMModelType,
      isMany
        ? this.links.many
        : isRequired
        ? this.links.oneRequired
        : this.links.one
    );

    return <AMInputField>{
      name: this.getFieldName(field),
      type,
      ...defaultObjectFieldVisitorHandler(field.relation.storeField, field),
    };
  }
}
