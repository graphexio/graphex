import TypeWrap from '@apollo-model/type-wrap';
import R from 'ramda';
import { AMDataContext } from '../../execution/contexts/data';
import { AMObjectFieldContext } from '../../execution/contexts/objectField';
import { AMResultPromise } from '../../execution/resultPromise';
import { AMInputField, IAMInputFieldFactory } from '../../types';
import { AMCreateManyRelationTypeFactory } from '../createManyRelation';
import { AMCreateOneRelationTypeFactory } from '../createOneRelation';

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
    let type = schemaInfo.resolveFactoryType(
      typeWrap.realType(),
      isMany ? AMCreateManyRelationTypeFactory : AMCreateOneRelationTypeFactory
    );

    return <AMInputField>{
      name: this.getFieldName(field),
      type,
      amEnter(node, transaction, stack) {
        const context = new AMObjectFieldContext(field.dbName);
        stack.push(context);
      },
      amLeave(node, transaction, stack) {
        const context = stack.pop() as AMObjectFieldContext;
        const lastInStack = R.last(stack);
        if (
          lastInStack instanceof AMDataContext ||
          lastInStack instanceof AMObjectFieldContext
        ) {
          if (context.value instanceof AMResultPromise) {
            lastInStack.addValue(
              context.fieldName,
              isMany
                ? context.value.distinct(field.relation.relationField)
                : context.value.path(field.relation.relationField)
            );
          }
        }
      },
    };
  },
};
