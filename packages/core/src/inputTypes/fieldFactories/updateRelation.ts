import TypeWrap from '@graphex/type-wrap';
import { AMInputFieldFactory, AMModelType } from '../../definitions';
import { AMObjectFieldContext } from '../../execution/contexts/objectField';

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
    const type = this.configResolver.resolveInputType(
      typeWrap.realType() as AMModelType,
      isMany
        ? 'updateManyRelation'
        : // : isRequired
          // ? AMUpdateOneRequiredRelationTypeFactory
          'updateOneRelation'
    );

    return {
      name: this.getFieldName(field),
      extensions: undefined,
      type,
      amEnter(node, transaction, stack) {
        const context = new AMObjectFieldContext(
          field.relation.storeField,
          field
        );
        stack.push(context);
      },
      amLeave(node, transaction, stack) {
        const operation = stack.lastOperation();
        const path = stack.getFieldPath(operation);
        const context = stack.pop() as AMObjectFieldContext;

        if (context.value) {
          const data = stack.getOperationData(operation);
          const set = (data.data && data.data['$set']) || {};
          data.addValue('$set', set);
          set[path] = context.value;
        }
      },
    };
  }
}
