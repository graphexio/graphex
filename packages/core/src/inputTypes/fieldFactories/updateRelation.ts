import TypeWrap from '@apollo-model/type-wrap';
import R from 'ramda';
import { AMDataContext } from '../../execution/contexts/data';
import { AMObjectFieldContext } from '../../execution/contexts/objectField';
import { AMResultPromise } from '../../execution/resultPromise';
import { AMInputField, IAMInputFieldFactory } from '../../definitions';
import { AMUpdateManyRelationTypeFactory } from '../updateManyRelation';
import { AMUpdateOneRelationTypeFactory } from '../updateOneRelation';
import {
  getLastOperation,
  getFieldPath,
  getOperationData,
} from '../../execution/utils';

export const AMUpdateRelationFieldFactory: IAMInputFieldFactory = {
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
        ? AMUpdateManyRelationTypeFactory
        : // : isRequired
          // ? AMUpdateOneRequiredRelationTypeFactory
          AMUpdateOneRelationTypeFactory
    );

    return <AMInputField>{
      name: this.getFieldName(field),
      type,
      amEnter(node, transaction, stack) {
        const context = new AMObjectFieldContext(
          field.relation.storeField,
          field
        );
        stack.push(context);
      },
      amLeave(node, transaction, stack) {
        const operation = getLastOperation(stack);
        const path = getFieldPath(stack, operation);
        const context = stack.pop() as AMObjectFieldContext;

        if (context.value) {
          const data = getOperationData(stack, operation);
          const set = (data.data && data.data['$set']) || {};
          data.addValue('$set', set);
          set[path] = context.value;
        }
        // const lastInStack = R.last(stack);
        // if (
        //   lastInStack instanceof AMDataContext ||
        //   lastInStack instanceof AMObjectFieldContext
        // ) {
        //   if (context.value instanceof AMResultPromise) {
        //     lastInStack.addValue(
        //       context.fieldName,
        //       isMany
        //         ? context.value.distinct(field.relation.relationField)
        //         : context.value.path(field.relation.relationField)
        //     );
        //   }
        // }
      },
    };
  },
};
