import TypeWrap from '@apollo-model/type-wrap';
import { getNamedType, isCompositeType } from 'graphql';
import { AMInputField, IAMInputFieldFactory } from '../../types';
import { AMCreateManyNestedTypeFactory } from '../createManyNested';
import { AMCreateOneNestedTypeFactory } from '../createOneNested';
import { defaultObjectFieldVisitorHandler } from '../visitorHandlers';

export const AMCreateNestedFieldFactory: IAMInputFieldFactory = {
  isApplicable(field) {
    return isCompositeType(getNamedType(field.type)) && !field.relation;
  },
  getFieldName(field) {
    return field.name;
  },
  getField(field, schemaInfo) {
    const typeWrap = new TypeWrap(field.type);
    let type = schemaInfo.resolveFactoryType(
      typeWrap.realType(),
      typeWrap.isMany()
        ? AMCreateManyNestedTypeFactory
        : AMCreateOneNestedTypeFactory
    );

    return <AMInputField>{
      name: this.getFieldName(field),
      type,
      ...defaultObjectFieldVisitorHandler(field.dbName),
    };
  },
};
