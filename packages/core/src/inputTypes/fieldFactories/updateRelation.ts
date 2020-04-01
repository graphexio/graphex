import TypeWrap from '@apollo-model/type-wrap';
import {
  AMInputField,
  AMInputFieldFactory,
  AMModelType,
} from '../../definitions';
import { AMObjectFieldContext } from '../../execution/contexts/objectField';
import {
  getFieldPath,
  getLastOperation,
  getOperationData,
} from '../../execution/utils';

export class AMUpdateRelationFieldFactory extends AMInputFieldFactory {
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
        ? 'updateManyRelation'
        : // : isRequired
          // ? AMUpdateOneRequiredRelationTypeFactory
          'updateOneRelation'
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
  }
}
