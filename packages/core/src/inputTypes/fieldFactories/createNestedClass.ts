import TypeWrap from '@apollo-model/type-wrap';
import { getNamedType, isCompositeType } from 'graphql';
import {
  AMInputField,
  AMInputFieldFactory,
  AMModelType,
} from '../../definitions';
import { AMCreateManyNestedTypeFactory } from '../createManyNested';
import { AMCreateOneNestedTypeFactory } from '../createOneNested';
import { defaultObjectFieldVisitorHandler } from '../visitorHandlers';

export class AMCreateNestedFieldFactory extends AMInputFieldFactory {
  isApplicable(field) {
    return isCompositeType(getNamedType(field.type)) && !field.relation;
  }
  getFieldName(field) {
    return field.name;
  }
  getField(field) {
    const typeWrap = new TypeWrap(field.type);
    let type = this.configResolver.resolveInputType(
      typeWrap.realType() as AMModelType,
      typeWrap.isMany() ? this.links.many : this.links.one
    );

    return <AMInputField>{
      name: this.getFieldName(field),
      type,
      ...defaultObjectFieldVisitorHandler(field.dbName),
    };
  }
}
