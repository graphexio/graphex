import TypeWrap from '@apollo-model/type-wrap';
import R from 'ramda';
import { AMDataContext } from '../../execution/contexts/data';
import { AMObjectFieldContext } from '../../execution/contexts/objectField';
import { AMResultPromise } from '../../execution/resultPromise';
import { AMInputField, IAMInputFieldFactory } from '../../definitions';
import { AMCreateManyRelationTypeFactory } from '../createManyRelation';
import { AMCreateOneRelationTypeFactory } from '../createOneRelation';
import { AMCreateOneRequiredRelationTypeFactory } from '../createOneRequiredRelation';
import { defaultObjectFieldVisitorHandler } from '../visitorHandlers';

export const AMCreateRelationFieldFactory: IAMInputFieldFactory = {
  isApplicable(field) {
    return Boolean(field.relation);
  },
  getFieldName(field) {
    return field.name;
  },
  getField(field, schemaInfo) {
    const typeWrap = new TypeWrap(field.type);
    const isMany = typeWrap.isMany();
    const isRequired = typeWrap.isRequired();
    let type = schemaInfo.resolveFactoryType(
      typeWrap.realType(),
      isMany
        ? AMCreateManyRelationTypeFactory
        : isRequired
        ? AMCreateOneRequiredRelationTypeFactory
        : AMCreateOneRelationTypeFactory
    );

    return <AMInputField>{
      name: this.getFieldName(field),
      type,
      ...defaultObjectFieldVisitorHandler(field.relation.storeField, field),
    };
  },
};
