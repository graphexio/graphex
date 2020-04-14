import { AMInputObjectType, AMModelType, AMTypeFactory } from '../definitions';
import { AMObjectFieldContext } from '../execution/contexts/objectField';
import {
  AMUpdateOperation,
  ArrayFilter,
} from '../execution/operations/updateOperation';

export class AMUpdateWithWhereNestedTypeFactory extends AMTypeFactory<
  AMInputObjectType
> {
  isApplicable() {
    return true;
  }
  getTypeName(modelType: AMModelType): string {
    return `${modelType.name}UpdateWithWhereNestedInput`;
  }
  getType(modelType: AMModelType) {
    let arrayFilter: ArrayFilter;

    return new AMInputObjectType({
      name: this.getTypeName(modelType),
      fields: () => {
        const fields = {
          where: {
            type: this.configResolver.resolveInputType(
              modelType,
              this.links.where
            ),
            amEnter(node, transaction, stack) {
              const context = new AMObjectFieldContext('where');
              stack.push(context);
            },
            amLeave(node, transaction, stack) {
              const context = stack.pop() as AMObjectFieldContext;
              arrayFilter.filter = context.value;
            },
          },
          data: {
            type: this.configResolver.resolveInputType(
              modelType,
              this.links.data
            ),
          },
        };

        return fields;
      },
      amEnter(node, transaction, stack) {
        const operation = stack.lastOperation();
        if (!(operation instanceof AMUpdateOperation)) {
          throw new Error(
            'UpdateManyNested may be used with Update operation only'
          );
        }
        arrayFilter = operation.createArrayFilter();

        const context = new AMObjectFieldContext(`$[${arrayFilter.name}]`);
        stack.push(context);
      },
      amLeave(node, transaction, stack) {
        stack.pop();
      },
    });
  }
}
