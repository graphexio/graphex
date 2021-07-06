import TypeWrap from '@graphex/type-wrap';
import {
  AMInputField,
  AMInputFieldFactory,
  AMModelType,
} from '../../../definitions';
import { AMObjectFieldContext } from '../../../execution/contexts/objectField';
import { isSubdocumentField } from '../../../utils';

export class AMUpdateNestedFieldFactory extends AMInputFieldFactory {
  isApplicable(field) {
    return isSubdocumentField(field);
  }
  getFieldName(field) {
    return field.name;
  }
  getField(field): AMInputField {
    const typeWrap = new TypeWrap(field.type);
    const type = this.configResolver.resolveInputType(
      typeWrap.realType() as AMModelType,
      typeWrap.isMany() ? this.links.many : this.links.one
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
        stack.pop();
      },
    };
  }
}
