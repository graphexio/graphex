import TypeWrap from '@graphex/type-wrap';
import {
  AMInputFieldFactory,
  AMModelField,
  AMModelType,
} from '../../definitions';
import { AMObjectFieldContext } from '../../execution';

export class AMUpdateRelationOutsideFieldFactory extends AMInputFieldFactory {
  isApplicable(field: AMModelField) {
    return Boolean(field.isRelationOutside);
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
        ? 'updateManyRelationOutside'
        : // : isRequired
          // ? AMUpdateOneRequiredRelationTypeFactory
          'updateOneRelationOutside'
    );

    return {
      name: this.getFieldName(field),
      extensions: undefined,
      type,
      amEnter(node, transaction, stack) {
        const action = new AMObjectFieldContext(field.dbName);
        stack.push(action);
      },
      amLeave(node, transaction, stack) {
        const operation = stack.lastOperation();
        const path = stack.getFieldPath(operation);
        const context = stack.pop() as AMObjectFieldContext;

        const data = stack.getOperationData(operation);
        const set = (data.data && data.data['$set']) || {};
        data.addValue('$set', set);
        if (context.value) {
          set[path] = context.value;
        }
      },
    };
  }
}
